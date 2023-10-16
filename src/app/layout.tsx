export const metadata = {
  title: "Codebase Assistant",
  description: "Personal AI Codebase Asstant using OpenAI, Pinecone, and Vercel AI SDK",
};

import "../global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
