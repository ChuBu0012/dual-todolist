import re

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Known multi-line block 1 in firestoreService.ts
    block1 = """      console.error('[DEBUG-7f3a] Error in firestoreService.createCard:', error);
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        console.error('[DEBUG-7f3a] Error details:', {
          code: err.code,
          name: err.name,
          message: err.message,
        });
      }"""
    replacement1 = """      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
      }"""
    content = content.replace(block1, replacement1)

    # Remove all single lines containing [DEBUG-7f3a]
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if '[DEBUG-7f3a]' in line:
            # Check if it's a multiline statement start
            if '{' in line and not line.endswith('}'):
                # We have some multi-line objects but the only big one was in createCard, wait there might be others.
                pass
            continue
        new_lines.append(line)

    # Also clean up the remaining empty if statement we left in replacement1
    content = '\n'.join(new_lines)
    content = content.replace("""      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
      }""", "")

    with open(filepath, 'w') as f:
        f.write(content)

clean_file("src/services/firestoreService.ts")
clean_file("src/store/todoStore.ts")
print("Cleaned logs")
