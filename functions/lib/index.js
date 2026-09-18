"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminderTask = exports.onCardUpdate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const tasks_1 = require("@google-cloud/tasks");
admin.initializeApp();
const tasksClient = new tasks_1.CloudTasksClient();
exports.onCardUpdate = (0, firestore_1.onDocumentWritten)("todos/{cardId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const after = snapshot.after.data();
    // If document was deleted, do not schedule
    if (!after) {
        return;
    }
    const items = after.items || [];
    const cardId = event.params.cardId;
    const projectId = process.env.GCLOUD_PROJECT || admin.app().options.projectId;
    if (!projectId) {
        console.error("Project ID not found");
        return;
    }
    const location = "us-central1"; // Modify if deploying to a different region
    const queue = "reminder-queue";
    // Scan items for !HH.MM or !HH:MM
    for (const item of items) {
        if (item.completed)
            continue;
        const text = item.text || "";
        const match = text.match(/!(\d{1,2})[.:](\d{2})/);
        if (!match)
            continue;
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        // Assuming user's timezone is GMT+7 for the parsing logic based on system time
        const tzOffset = 7 * 60; // 7 hours in minutes
        const now = new Date();
        const localNowMs = now.getTime() + tzOffset * 60 * 1000;
        const targetLocal = new Date(localNowMs);
        targetLocal.setUTCHours(hours, minutes, 0, 0);
        // If the target time has already passed today, assume tomorrow
        if (targetLocal.getTime() < localNowMs) {
            targetLocal.setUTCDate(targetLocal.getUTCDate() + 1);
        }
        // Convert back to absolute UTC timestamp
        const targetAbsTime = targetLocal.getTime() - tzOffset * 60 * 1000;
        // We want to schedule tasks 30, 20, 10, and 5 minutes before
        const offsets = [30, 20, 10, 5];
        const baseUrl = `https://${location}-${projectId}.cloudfunctions.net/sendReminderTask`;
        for (const offset of offsets) {
            const scheduleTimeMs = targetAbsTime - offset * 60 * 1000;
            // If the schedule time is in the past, skip scheduling
            if (scheduleTimeMs <= Date.now())
                continue;
            const queuePath = tasksClient.queuePath(projectId, location, queue);
            const payload = {
                cardId,
                itemId: item.id,
                text,
                offset
            };
            const task = {
                httpRequest: {
                    httpMethod: 'POST',
                    url: baseUrl,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                },
                scheduleTime: {
                    seconds: Math.floor(scheduleTimeMs / 1000),
                },
            };
            try {
                await tasksClient.createTask({
                    parent: queuePath,
                    task,
                });
                console.log(`Scheduled task for ${cardId}/${item.id} offset ${offset}m at ${new Date(scheduleTimeMs).toISOString()}`);
            }
            catch (e) {
                console.error("Error scheduling task", e);
            }
        }
    }
});
exports.sendReminderTask = (0, https_1.onRequest)(async (req, res) => {
    const { cardId, itemId, offset } = req.body;
    if (!cardId || !itemId) {
        res.status(400).send("Missing parameters");
        return;
    }
    const db = admin.firestore();
    const doc = await db.collection("todos").doc(cardId).get();
    if (!doc.exists) {
        res.status(200).send("Document deleted, skipping reminder");
        return;
    }
    const data = doc.data();
    const items = data?.items || [];
    const item = items.find((i) => i.id === itemId);
    // Skip if item was removed or completed
    if (!item || item.completed) {
        res.status(200).send("Item completed or deleted, skipping reminder");
        return;
    }
    // Skip if pattern was removed
    if (!item.text.match(/!(\d{1,2})[.:](\d{2})/)) {
        res.status(200).send("Pattern removed from item, skipping reminder");
        return;
    }
    // Send Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: `Reminder: Task "${item.text}" is due in ${offset} minutes!`
                })
            });
            console.log(`Webhook sent for ${item.text} (${offset}m)`);
        }
        catch (e) {
            console.error("Failed to send webhook", e);
            res.status(500).send("Failed to send webhook");
            return;
        }
    }
    else {
        console.warn("DISCORD_WEBHOOK_URL not set");
    }
    res.status(200).send("OK");
});
//# sourceMappingURL=index.js.map