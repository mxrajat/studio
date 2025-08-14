'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { getSuggestedFilename } from '@/app/actions';
import { UploadCloud, FileX2, FileDown, Share2, Loader2, Wand2 } from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export default function FotoPdfMaker() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('fotopdf-export.pdf');
  const [isConverting, setIsConverting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const draggedItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(e.target.files);
    }
  };

  const addImages = (files: FileList) => {
    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: self.crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

    if (newImages.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select only image files.",
      });
      return;
    }
    
    setImages(prev => [...prev, ...newImages]);
    setPdfUrl(null);
  };
  
  const suggestFilename = useCallback(async () => {
    if (images.length === 0) return;
    setIsSuggesting(true);
    try {
      const imageNames = images.map(img => img.file.name);
      const suggested = await getSuggestedFilename(imageNames);
      setFilename(suggested.endsWith('.pdf') ? suggested : `${suggested}.pdf`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get AI filename suggestion. Please enter a name manually.",
      });
    } finally {
      setIsSuggesting(false);
    }
  }, [images, toast]);

  useEffect(() => {
    if (images.length > 0 && !pdfUrl) {
      suggestFilename();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    draggedItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (draggedItem.current !== null && dragOverItem.current !== null && draggedItem.current !== dragOverItem.current) {
        const newImages = [...images];
        const dragged = newImages.splice(draggedItem.current, 1)[0];
        newImages.splice(dragOverItem.current, 0, dragged);
        setImages(newImages);
    }
    draggedItem.current = null;
    dragOverItem.current = null;
  };
  
  const handleConvertToPdf = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setPdfUrl(null);

    try {
      const doc = new jsPDF();
      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        const img = images[i].file;
        const imgData = await img.arrayBuffer();
        const imgProps = doc.getImageProperties(new Uint8Array(imgData));
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const ratio = imgProps.width / imgProps.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
          imgHeight = pdfHeight - 20;
          imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        doc.addImage(new Uint8Array(imgData), imgProps.fileType, x, y, imgWidth, imgHeight);
      }
      const url = doc.output('datauristring');
      setPdfUrl(url);
    } catch(err) {
       toast({
        variant: "destructive",
        title: "PDF Conversion Failed",
        description: "Something went wrong while creating the PDF. Please try again.",
      });
    } finally {
        setIsConverting(false);
    }
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    try {
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: "application/pdf" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: filename,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Sharing Not Supported",
                description: "Your browser does not support sharing files.",
            });
        }
    } catch(err) {
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the file. Please try downloading it instead.",
        });
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };
  
  const handleFileDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addImages(e.dataTransfer.files);
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
            <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <UploadCloud className="w-12 h-12 text-primary" />
                    <p className="font-semibold text-foreground">
                        Drag & drop images here, or click to select files
                    </p>
                    <p className="text-sm text-muted-foreground">Supports JPEG, PNG, WEBP</p>
                </div>
                <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
        </CardContent>
      </Card>
      
      {images.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center font-headline">Your Images ({images.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
            {images.map((image, index) => (
              <Card 
                key={image.id}
                className="relative group overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
              >
                <Image src={image.preview} alt={image.file.name} width={200} height={200} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" onClick={() => handleRemoveImage(image.id)} aria-label="Remove image">
                    <FileX2 className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs p-2 bg-card truncate" title={image.file.name}>{image.file.name}</p>
              </Card>
            ))}
          </div>
          
          <Card className="p-6 bg-card/80 shadow-inner">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full">
                    <Input 
                        type="text" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="Enter PDF filename"
                        className="text-base"
                    />
                </div>
                <Button onClick={suggestFilename} disabled={isSuggesting} className="w-full sm:w-auto">
                    {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span>Suggest Name</span>
                </Button>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleConvertToPdf} disabled={isConverting} size="lg" className="w-full sm:w-auto">
                  {isConverting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-cog"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"/><path d="M14 2v6h6"/><circle cx="12" cy="15" r="1"/><path d="M12 12v1"/><path d="M12 17v-1"/><path d="m14.6 13.5-.87.5"/><path d="m10.27 15.99-.87.5"/><path d="m14.6 16.5-.87-.5"/><path d="m10.27 14-.87-.5"/><path d="m15.5 15-.5.87"/><path d="m9.43 15-.5.87"/><path d="m15.5 15 .5-.87"/><path d="m9.43 15 .5-.87"/></svg>
                  )}
                  <span>{isConverting ? 'Converting...' : 'Convert to PDF'}</span>
                </Button>
            </div>
          </Card>

          {pdfUrl && (
            <Card className="p-6 bg-green-50 border-green-200 text-center animate-in fade-in-50 duration-500">
                <h3 className="text-2xl font-bold text-green-800 font-headline">Your PDF is Ready!</h3>
                <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                     <a href={pdfUrl} download={filename}>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                            <FileDown className="w-5 h-5"/>
                            <span>Download PDF</span>
                        </Button>
                     </a>
                     {navigator.share && (
                        <Button onClick={handleShare} size="lg" variant="outline" className="w-full sm:w-auto">
                            <Share2 className="w-5 h-5"/>
                            <span>Share</span>
                        </Button>
                     )}
                </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
