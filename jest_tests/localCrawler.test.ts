import { LocalCrawler, Page } from '../src/app/api/crawl/localCrawler';
import fs from 'fs';
import { sep } from 'path';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  relative: jest.fn(() => 'mockPath/file1.txt'),
}));

describe('LocalCrawler', () => {
  let crawler: LocalCrawler;
  const mockDirectory = '/mockPath';
  const mockIgnoreFile = '/mockPath/.ignore';

  beforeEach(() => {
    crawler = new LocalCrawler(100);
    (fs.readdirSync as jest.Mock).mockReturnValue(['file1.txt', 'file2.txt']);
    (fs.readFileSync as jest.Mock).mockReturnValue('sample content');
    (fs.statSync as jest.Mock).mockReturnValue({
      isDirectory: () => false
    });
  });

  it('should crawl a given directory', async () => {
    const pages = await crawler.crawl(mockDirectory, mockIgnoreFile);

    expect(pages.length).toBe(2);
    expect(pages[0]).toEqual({ path: `${sep}mockPath${sep}file1.txt`, content: 'sample content' });
    //expect(pages[0]).toEqual({ path: '/mockPath/file1.txt', content: 'sample content' });
  });

  // Additional tests can go here
});
