import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image as ImageIcon, Upload, Trash2, Loader2, Video, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const GalleryManager = () => {
  const { settings, updateSettings, refreshSettings } = useVenueSettings();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const galleryUrls = settings?.gallery_urls || [];

  const isVideo = (url: string) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideoFile = file.type.startsWith('video/');
        const isImageFile = file.type.startsWith('image/');

        if (!isVideoFile && !isImageFile) {
          toast.error(`Arquivo ${file.name} não é uma imagem ou vídeo válido`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('venue-images')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('venue-images')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        const updatedUrls = [...galleryUrls, ...newUrls];
        const { error: updateError } = await updateSettings({ gallery_urls: updatedUrls } as any);

        if (updateError) {
          toast.error('Erro ao atualizar galeria');
        } else {
          toast.success(`${newUrls.length} arquivo(s) adicionado(s)!`);
          await refreshSettings();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload');
    }

    setUploading(false);
    event.target.value = '';
  };

  const handleDelete = async (url: string) => {
    setDeleting(url);

    try {
      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage
        .from('venue-images')
        .remove([fileName]);

      // Update settings
      const updatedUrls = galleryUrls.filter(u => u !== url);
      const { error } = await updateSettings({ gallery_urls: updatedUrls } as any);

      if (error) {
        toast.error('Erro ao remover da galeria');
      } else {
        toast.success('Mídia removida!');
        await refreshSettings();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover mídia');
    }

    setDeleting(null);
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= galleryUrls.length) return;

    const newUrls = [...galleryUrls];
    [newUrls[fromIndex], newUrls[toIndex]] = [newUrls[toIndex], newUrls[fromIndex]];
    
    updateSettings({ gallery_urls: newUrls } as any).then(({ error }) => {
      if (!error) {
        refreshSettings();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Galeria de Mídia (Hero)
        </CardTitle>
        <CardDescription>
          Imagens e vídeos exibidos no carrossel da página inicial. 
          Formatos suportados: JPG, PNG, WEBP, MP4, WEBM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div>
          <label htmlFor="gallery-upload" className="cursor-pointer block">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              {uploading ? (
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Enviando...' : 'Clique para adicionar imagens ou vídeos'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Múltiplos arquivos suportados
              </p>
            </div>
            <Input
              id="gallery-upload"
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
              multiple
            />
          </label>
        </div>

        {/* Gallery Preview */}
        {galleryUrls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryUrls.map((url, index) => (
              <div
                key={url}
                className="relative group aspect-video rounded-lg overflow-hidden border border-border"
              >
                {isVideo(url) ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Gallery item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {isVideo(url) && (
                    <Video className="absolute top-2 left-2 w-5 h-5 text-white" />
                  )}
                  
                  <div className="flex flex-col gap-1">
                    {index > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => moveItem(index, 'up')}
                      >
                        ↑
                      </Button>
                    )}
                    {index < galleryUrls.length - 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => moveItem(index, 'down')}
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(url)}
                    disabled={deleting === url}
                  >
                    {deleting === url ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Order badge */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma mídia na galeria</p>
            <p className="text-sm">Adicione imagens ou vídeos para o carrossel</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryManager;
