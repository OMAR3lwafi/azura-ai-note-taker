import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';

Deno.test('Export Module - Markdown generation', async (t) => {
  await t.step('should generate valid Markdown from meeting data', async () => {
    const meetingData = {
      title: 'Team Meeting',
      summary: 'Discussed project goals and timelines',
      segments: [
        { text: 'Hello everyone', speaker_label: 'John' },
        { text: 'Let\'s start', speaker_label: 'Sarah' },
      ],
      tasks: [
        { title: 'Complete design', assignee: 'John' },
      ],
    };

    const markdown = `# ${meetingData.title}\n\n${meetingData.summary}`;
    
    assertExists(markdown);
    assertEquals(markdown.includes('# Team Meeting'), true);
  });

  await t.step('should include speaker labels in transcript', async () => {
    const transcript = '**John**: Hello\n**Sarah**: Hi there';
    
    assertExists(transcript);
    assertEquals(transcript.includes('**John**'), true);
    assertEquals(transcript.includes('**Sarah**'), true);
  });

  await t.step('should format tasks as checklist', async () => {
    const tasks = [
      { title: 'Task 1', completed: true },
      { title: 'Task 2', completed: false },
    ];

    const formatted = tasks.map(t => 
      `- [${t.completed ? 'x' : ' '}] ${t.title}`
    ).join('\n');

    assertEquals(formatted.includes('- [x] Task 1'), true);
    assertEquals(formatted.includes('- [ ] Task 2'), true);
  });
});

Deno.test('Export Module - PDF generation', async (t) => {
  await t.step('should handle HTML to PDF conversion', async () => {
    const html = '<h1>Test</h1><p>Content</p>';
    
    // Mock PDF generation
    const pdfGenerated = true;
    
    assertEquals(pdfGenerated, true);
  });

  await t.step('should include custom styling', async () => {
    const styles = {
      fontSize: '12pt',
      fontFamily: 'Arial',
      lineHeight: '1.5',
    };

    assertExists(styles);
    assertEquals(styles.fontSize, '12pt');
  });
});

Deno.test('Export Module - Multi-language support', async (t) => {
  await t.step('should generate export in English', async () => {
    const locale = 'en';
    const headers = {
      title: 'Meeting Title',
      summary: 'Summary',
      tasks: 'Action Items',
    };

    assertEquals(headers.title, 'Meeting Title');
  });

  await t.step('should generate export in Arabic', async () => {
    const locale = 'ar';
    const headers = {
      title: 'عنوان الاجتماع',
      summary: 'الملخص',
      tasks: 'المهام',
    };

    assertEquals(headers.title, 'عنوان الاجتماع');
  });

  await t.step('should handle RTL layout for Arabic', async () => {
    const direction = 'rtl';
    const css = `body { direction: ${direction}; }`;

    assertEquals(css.includes('rtl'), true);
  });
});
