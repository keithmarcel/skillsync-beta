#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/EntityDetailView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add description rendering after each Label component
const patterns = [
  // Pattern 1: After Label, before Input/Textarea/Select
  {
    search: /(<Label[^>]*>\s*{field\.label}\s*{field\.required[^}]+}\s*<\/Label>)(\s*)(<Input|<Textarea|<Select|<Switch)/g,
    replace: '$1\n            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}$2$3'
  },
  // Pattern 2: Add helpText before error message
  {
    search: /(\s*)({\s*error\s*&&\s*<p className="text-sm text-destructive">{error}<\/p>\s*})/g,
    replace: '$1{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}\n$1$2'
  }
];

patterns.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added description and helpText rendering to EntityDetailView.tsx');
