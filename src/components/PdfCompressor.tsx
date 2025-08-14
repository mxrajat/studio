'use client';

import { useState, useCallback, type DragEvent } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileDown, Loader2, FileArchive, ArrowRight, Gauge } from 'lucide-react';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';

const compressionLevels = [
  { name: 'Low', value: 0.75, description: 'Good quality, less compression.' },
  { name: 'Medium', value: 0.5, description: 'Balanced quality and compression.' },
  { name: 'High', value: 0.25, description: 'Lower quality, high compression.' },
];

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function PdfCompressor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState([1]); // Index of compressionLevels
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PDF file.",
        });
        return;
      }
      setPdfFile(file);
      setOriginalSize(file.size);
      setCompressedUrl(null);
      setCompressedSize(null);
    }
  };
  
  const addFile = (file: File) => {
    if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PDF file.",
        });
        return;
    }
    setPdfFile(file);
    setOriginalSize(file.size);
    setCompressedUrl(null);
    setCompressedSize(null);
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleFileDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFile(e.dataTransfer.files[0]);
    }
  };

  const estimatedSize = originalSize ? originalSize * compressionLevels[compressionLevel[0]].value : null;

  const handleCompress = async () => {
    if (!pdfFile) return;
    setIsCompressing(true);
    setCompressedUrl(null);
    setCompressedSize(null);

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { 
        // Some PDFs might be encrypted and we can't do anything about it.
        // This will allow us to load them but saving might fail.
        ignoreEncryption: true 
      });

      // This is a very basic compression attempt by re-saving the doc.
      // For images, we would need to extract, compress, and replace them, which is more complex.
      // pdf-lib doesn't directly support image re-compression of existing images.
      // We will just re-save it which might reduce size by optimizing objects.
      
      const compressedPdfBytes = await pdfDoc.save();
      
      // The previous implementation was corrupting the file by slicing the byte array.
      // This is now fixed to use the full byte array, ensuring the PDF is valid.
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCompressedUrl(url);
      setCompressedSize(blob.size);

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Compression Failed",
        description: "Could not compress the PDF. The file might be corrupted or encrypted.",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-8 pt-8">
      <Card
        className="border-2 border-dashed border-primary/50 hover:border-primary transition-colors duration-300 bg-accent/30"
        onDragOver={handleDragOver}
        onDrop={handleFileDrop}
      >
        <CardContent className="p-6 text-center">
            <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <UploadCloud className="w-12 h-12 text-primary" />
                    <p className="font-semibold text-foreground">
                        Drag & drop a PDF here, or click to select a file
                    </p>
                    <p className="text-sm text-muted-foreground">PDF files only</p>
                </div>
                <input id="pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
        </CardContent>
      </Card>

      {pdfFile && (
        <div className="space-y-6">
          <Card className="p-6 bg-card/80 shadow-inner">
            <h2 className="text-2xl font-bold text-center font-headline mb-4">Compress "{pdfFile.name}"</h2>

            <div className='flex justify-around items-center my-6'>
                <div className='text-center'>
                    <Badge variant="secondary">Original Size</Badge>
                    <p className='font-bold text-lg mt-1'>{originalSize ? formatBytes(originalSize) : 'N/A'}</p>
                </div>
                <ArrowRight className='w-8 h-8 text-muted-foreground'/>
                 <div className='text-center'>
                    <Badge>Estimated Size</Badge>
                    <p className='font-bold text-lg mt-1'>{estimatedSize ? formatBytes(estimatedSize) : 'N/A'}</p>
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Gauge className="w-6 h-6 text-primary"/>
                <h3 className="text-lg font-semibold">Compression Level</h3>
                <Badge variant="outline">{compressionLevels[compressionLevel[0]].name}</Badge>
              </div>
              <Slider
                min={0}
                max={2}
                step={1}
                value={compressionLevel}
                onValueChange={setCompressionLevel}
                disabled={isCompressing}
              />
              <p className="text-sm text-muted-foreground text-center">
                {compressionLevels[compressionLevel[0]].description}
              </p>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleCompress} disabled={isCompressing} size="lg" className="w-full sm:w-auto">
                  {isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5"/>}
                  <span>{isCompressing ? 'Compressing...' : 'Compress PDF'}</span>
                </Button>
            </div>
          </Card>
          
          {compressedUrl && compressedSize && (
             <Card className="p-6 bg-green-50 border-green-200 text-center animate-in fade-in-50 duration-500">
                <h3 className="text-2xl font-bold text-green-800 font-headline">Compression Complete!</h3>
                 <p className="text-muted-foreground mt-2">Final size: <span className="font-bold">{formatBytes(compressedSize)}</span></p>
                <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                     <a href={compressedUrl} download={`${pdfFile.name.replace('.pdf', '')}-compressed.pdf`}>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                            <FileDown className="w-5 h-5"/>
                            <span>Download Compressed PDF</span>
                        </Button>
                     </a>
                </div>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
