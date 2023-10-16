import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

interface Page {
  path: string;
  content: string;
}

class LocalCrawler {
  private seen = new Set<string>();
  private pages: Page[] = [];
  private ig = ignore();

  constructor(private maxPages = 100) {}

  // Main function to start the crawling process
  async crawl(startPath: string, ignoreFile: string): Promise<Page[]> {
    // Load ignore patterns
    console.log(ignoreFile);
    const ignorePatterns = fs.readFileSync(ignoreFile, 'utf-8');
    this.ig.add(ignorePatterns);

    // Start processing the directory
    this.processDirectory(startPath);

    // Return the crawled pages
    return this.pages;
  }

  // Process a directory: list its files, and decide whether to process or ignore each one
  private processDirectory(directoryPath: string) {
    const files = fs.readdirSync(directoryPath);
    
    for (const file of files) {
      // Stop if we have enough pages
      if (this.pages.length >= this.maxPages) {
        break;
      }

      const filePath = path.join(directoryPath, file);

      // If it's a directory, recurse into it. If it's a file, process it.
      if (fs.statSync(filePath).isDirectory()) {
        this.processDirectory(filePath);
      } else {
        this.processFile(filePath);
      }
    }
  }

  // Process a file: read its content and add it to the pages array
  private processFile(filePath: string) {
    // Check if we've seen this file before or if it should be ignored
    if (this.isAlreadySeen(filePath) || this.shouldIgnore(filePath)) {
      return;
    }

    // Mark the file as seen
    this.seen.add(filePath);

    // Read the file content and add a new page to the pages array
    const content = fs.readFileSync(filePath, 'utf8');
    this.pages.push({ path: filePath, content: content });
  }

  // Check if a file/path has already been processed
  private isAlreadySeen(filePath: string) {
    return this.seen.has(filePath);
  }

  // Check if a file/path should be ignored based on the ignore patterns
  private shouldIgnore(filePath: string) {
    //return this.ig.ignores(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    return this.ig.ignores(relativePath);
  }
}

export { LocalCrawler };
export type { Page };
