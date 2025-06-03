#!/bin/bash

# Find all TypeScript files in the commands directory
find packages/cli/src/commands -name "*.ts" -type f | while read -r file; do
  # Skip if file is already commented
  if ! grep -q "^/\*" "$file"; then
    # Add comment markers at the start and end of the file
    sed -i '' '1i\
/*
' "$file"
    echo "*/" >> "$file"
  fi
done 
