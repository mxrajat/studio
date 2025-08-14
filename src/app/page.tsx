import FotoPdfMaker from '@/components/FotoPdfMaker';
import PdfCompressor from '@/components/PdfCompressor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileArchive } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-foreground bg-primary py-2 px-4 rounded-lg inline-block shadow-md">
          FotoPDF Suite
        </h1>
        <p className="font-body text-muted-foreground mt-4 text-lg">
          Your one-stop solution for PDF utilities.
        </p>
      </header>
      <Tabs defaultValue="image-to-pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image-to-pdf">
            <Image className="w-4 h-4 mr-2" />
            Image to PDF
          </TabsTrigger>
          <TabsTrigger value="compress-pdf">
            <FileArchive className="w-4 h-4 mr-2" />
            Compress PDF
          </TabsTrigger>
        </TabsList>
        <TabsContent value="image-to-pdf">
          <FotoPdfMaker />
        </TabsContent>
        <TabsContent value="compress-pdf">
          <PdfCompressor />
        </TabsContent>
      </Tabs>
    </main>
  );
}
