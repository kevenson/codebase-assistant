import { LocalCrawler } from '../src/app/api/crawl/localCrawler';
import fs from 'fs';
import path from 'path';

describe('LocalCrawler', () => {
  let crawler: LocalCrawler;

  beforeEach(() => {
    crawler = new LocalCrawler();
  });

  it('should crawl a directory and get content of files', async () => {
    // Set up mock directory and files for testing
    const mockDir = path.join(__dirname, 'mockDir');
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir);
    }  
    fs.writeFileSync(path.join(mockDir, 'testFile.txt'), 'Hello, World!');

    const ignoreFilePath = path.join(__dirname, '..', '.ignore');

    // Crawl the mock directory
    const pages = await crawler.crawl(mockDir, ignoreFilePath);

    // Expectations
    expect(pages).toHaveLength(1);
    expect(pages[0].content).toBe('Hello, World!');

    // Clean up
    fs.unlinkSync(path.join(mockDir, 'testFile.txt'));
    fs.rmdirSync(mockDir);
  });

  // ... add more tests as needed
});
