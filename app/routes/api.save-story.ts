import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import path from 'path';
import { saveStoryXML } from '~/lib/textEditor/storySerializer';
import type { StoryData } from '~/lib/textEditor/storyParser';

/**
 * API endpoint to save story changes
 *
 * POST /api/save-story
 * Body: { uploadId, storyId, storyData }
 */

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { uploadId, storyId, storyData } = body;

    if (!uploadId || !storyId || !storyData) {
      return json(
        { error: 'Missing required fields: uploadId, storyId, storyData' },
        { status: 400 }
      );
    }

    // Construct file path
    const storiesDir = path.join(process.cwd(), 'uploads', uploadId, 'extracted', 'Stories');
    const filePath = path.join(storiesDir, `Story_${storyId}.xml`);

    // Save story XML
    await saveStoryXML(storyData as StoryData, filePath);

    return json({
      success: true,
      message: `Story ${storyId} saved successfully`,
      filePath,
    });
  } catch (error) {
    console.error('Save story error:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to save story',
      },
      { status: 500 }
    );
  }
};
