# Adding New Homework Features

This guide explains how to add new homework modules to the LLM Bootcamp interface.

## Overview

The system uses a feature configuration approach where each homework assignment has its own feature ID and configuration. Features can be toggled on/off and have specific UI components that show/hide based on the selection.

## Steps to Add a New Homework Feature

### 1. Add Feature Configuration

In `frontend/script.js`, add your new feature to the `this.features` object:

```javascript
'06-your-feature': {
    name: 'Your Feature Name',
    description: 'Brief description of what this homework covers',
    enabled: false,  // Set to true when ready to release
    components: {
        uploadFile: true,      // Show/hide file upload button
        exportChat: true,      // Show/hide export button
        debugPanel: true,      // Show/hide debug panel
        systemPrompt: true,    // Use custom system prompt
        // Add custom component flags here
        yourCustomFeature: true
    },
    systemPrompt: 'Your custom system prompt for this feature'
}
```

### 2. Add to HTML Dropdown

In `frontend/index.html`, add your feature to the dropdown:

```html
<option value="06-your-feature" disabled>06 - Your Feature Name</option>
```

Remove `disabled` when the feature is ready.

### 3. Implement Backend Changes

For features requiring backend modifications:

1. Create a new endpoint in `api/app.py` if needed
2. Add new debug tracking decorators following CLAUDE.md guidelines
3. Update API routes for feature-specific functionality

### 4. Add UI Components

For custom UI elements:

1. Add HTML elements to `index.html` with appropriate IDs
2. Style them in `styles.css` following the existing design system
3. Initialize and control them in `script.js` within `applyFeatureSettings()`

Example:
```javascript
// In applyFeatureSettings()
if (components.yourCustomFeature) {
    document.getElementById('yourFeaturePanel').style.display = 'block';
} else {
    document.getElementById('yourFeaturePanel').style.display = 'none';
}
```

### 5. Enable the Feature

When ready to release:

1. Set `enabled: true` in the feature configuration
2. Remove `disabled` attribute from the HTML option
3. Test feature switching thoroughly

## Feature Examples

### 02 - Embeddings and RAG
- Adds file upload functionality
- Custom system prompt for context-aware responses
- Additional RAG controls panel (future implementation)

### 03 - AI Agents
- Tool usage capabilities
- Agent control panel
- Multi-step reasoning display

### 04 - Fine Tuning
- Model comparison tools
- A/B testing interface
- Performance metrics display

### 05 - Multimodal LLMs
- Image upload support
- Vision model selection
- Image analysis results panel

## Best Practices

1. **Maintain Backwards Compatibility**: Don't break existing features
2. **Use Feature Flags**: Hide incomplete features with `enabled: false`
3. **Clear Naming**: Use descriptive IDs and names
4. **Documentation**: Update this file when adding new feature types
5. **Test Switching**: Ensure smooth transitions between features

## Testing

1. Switch between all features to ensure proper UI updates
2. Check localStorage persistence of selected feature
3. Verify system prompts update correctly
4. Test with both light and dark themes
5. Ensure debug panel works with new features

## Common Issues

- **Feature not switching**: Check if feature ID matches in all locations
- **UI not updating**: Verify component flags in `applyFeatureSettings()`
- **Backend errors**: Ensure new endpoints follow existing patterns
- **Style issues**: Use CSS variables for consistent theming