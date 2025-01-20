import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {markdownSchema} from 'sanity-plugin-markdown'
import {codeInput} from '@sanity/code-input'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'rat-room',

  projectId: 'kupagww3',
  dataset: 'production',

  plugins: [ structureTool({ structure: deskStructure }), visionTool(), codeInput(), markdownSchema() ],

  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      const { type } = creationContext;
      const DISABLED_TYPES = [
        'worldPrompts'
      ];
      if (type === 'global') {
        return prev.filter((template) => !DISABLED_TYPES.includes(template.templateId));
      }
      return prev;
    },
  },
  schema: {
    types: schemaTypes,
  },
})
