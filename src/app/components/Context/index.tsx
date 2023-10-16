import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
//import UrlButton from "./UrlButton";
import { LocalCrawler, Page, DocumentFromAPI } from "@/api/crawl/localCrawler"; // Adjust the import path as needed
import { IUrlEntry } from "./UrlButton";
import { Card, ICard } from "./Card";
import { clearIndex, crawlDocument } from "./utils";

import { Button } from "./Button";
interface ContextProps {
  className: string;
  selected: string[] | null;
}

export const Context: React.FC<ContextProps> = ({ className, selected }) => {
  //const [entries, setEntries] = useState(urls);
  const [directoryPath, setDirectoryPath] = useState(""); // New state for directory path
  const [directoryEntries, setDirectoryEntries] = useState<IUrlEntry[]>([]);
  const [cards, setCards] = useState<ICard[]>([]);

  const [splittingMethod, setSplittingMethod] = useState("markdown");
  const [chunkSize, setChunkSize] = useState(256);
  const [overlap, setOverlap] = useState(1);
  

  // Scroll to selected card
  useEffect(() => {
    const element = selected && document.getElementById(selected[0]);
    element?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  const DropdownLabel: React.FC<
    React.PropsWithChildren<{ htmlFor: string }>
  > = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="text-white p-2 font-bold">
      {children}
    </label>
  );
  // This is the new function that will be triggered when the user wants to seed from a directory
  const handleSeedFromDirectory = async () => {
    try {
        const response = await fetch('/api/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startPath: directoryPath,
                ignoreFile: '/mockPath/.ignore',
                options: {
                    splittingMethod,
                    chunkSize,
                    chunkOverlap: overlap
                }
            })
        });
        
        const data = await response.json();
        if (data.success) {
          setCards(data.documents.map((doc: DocumentFromAPI) => ({
            title: doc.metadata.text,
            description: doc.metadata.filepath,
            id: doc.metadata.hash
        })));
        } else {
            console.error('Error seeding:', data.error);
        }
    } catch (error) {
        console.error('Error fetching:', error);
    }
};

  // Set the directory using a prompt
  const handleSetDirectory = () => {
    const newDir = window.prompt("Enter the new directory path:", directoryPath);
    if (newDir) {
      setDirectoryPath(newDir);
    }
  };

  return (
    <div className={`flex flex-col border-2 overflow-y-auto rounded-lg border-gray-500 w-full ${className}`}>
      <div className="flex flex-col items-start sticky top-0 w-full">
        <div className="flex flex-col items-start lg:flex-row w-full lg:flex-wrap p-2">
          {/* Display current directory */}
          <div className="p-2 mr-2 bg-gray-800 rounded text-white w-1/2">
            Current Directory: {directoryPath}
          </div>
          
          {/* Button to set/update the directory */}
          <Button
            onClick={handleSetDirectory}
            className="my-2 mr-2"
          >
            Set Directory
          </Button>

          {/* Seed from Directory button */}
          <Button
            onClick={handleSeedFromDirectory}
            className="my-2 mr-2"
          >
            Seed from Directory
          </Button>

          {/* Clear Index button */}
          <Button
            onClick={() => clearIndex(setDirectoryEntries, setCards)}
            className="my-2"
            style={{ backgroundColor: "#4f6574", color: "white" }}
          >
            Clear Index
          </Button>
        </div>
        <div className="flex p-2"></div>
        <div className="text-left w-full flex flex-col rounded-b-lg bg-gray-600 p-3 subpixel-antialiased">
          <DropdownLabel htmlFor="splittingMethod">
            Splitting Method:
          </DropdownLabel>
          <div className="relative w-full">
            <select
              id="splittingMethod"
              value={splittingMethod}
              className="p-2 bg-gray-700 rounded text-white w-full appearance-none hover:cursor-pointer"
              onChange={(e) => setSplittingMethod(e.target.value)}
            >
              <option value="recursive">Recursive Text Splitting</option>
              <option value="markdown">Markdown Splitting</option>
            </select>
          </div>
          {splittingMethod === "recursive" && (
            <div className="my-4 flex flex-col">
              <div className="flex flex-col w-full">
                <DropdownLabel htmlFor="chunkSize">
                  Chunk Size: {chunkSize}
                </DropdownLabel>
                <input
                  className="p-2 bg-gray-700"
                  type="range"
                  id="chunkSize"
                  min={1}
                  max={2048}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                />
              </div>
              <div className="flex flex-col w-full">
                <DropdownLabel htmlFor="overlap">
                  Overlap: {overlap}
                </DropdownLabel>
                <input
                  className="p-2 bg-gray-700"
                  type="range"
                  id="overlap"
                  min={1}
                  max={200}
                  onChange={(e) => setOverlap(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap w-full">
        {cards &&
          cards.map((card, key) => (
            <Card key={key} card={card} selected={selected} />
          ))}
      </div>
    </div>
  );
};
