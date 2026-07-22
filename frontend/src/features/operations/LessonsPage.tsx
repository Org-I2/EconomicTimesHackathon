/** Lessons Learned Page (SRD FR-9) */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, Tag as TagChip } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { lessonsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';
import { ErrorState } from '@/components/ui/ErrorState';

const lessonSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  equipment_tag: z.string().optional(),
  tags: z.string().optional(), // We'll parse this into an array
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTag, setSearchTag] = useState('');
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.lessons.list({ tag: searchTag || undefined }),
    queryFn: () => lessonsApi.list({ tag: searchTag || undefined, page_size: 50 }),
    retry: false,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: LessonFormData) => {
      const tags = data.tags 
        ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      return lessonsApi.create({
        title: data.title,
        content: data.content,
        equipment_tag: data.equipment_tag || undefined,
        tags,
      });
    },
    onSuccess: () => {
      toast.success('Lesson learned saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Failed to save lesson');
    }
  });

  const onSubmit = (data: LessonFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Lessons Learned"
        description="Capture and search tacit knowledge from engineers and operators"
        actions={
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Capture Lesson
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6 max-w-sm">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Filter by tag (e.g., pump, safety)..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border-primary bg-surface-primary text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="relative space-y-4 min-h-[300px]">
          <LoadingExperience 
            isLoading={isLoading} 
            variant="default"
            messages={['Fetching operator logs...', 'Retrieving safety observations...', 'Loading tacit knowledge...']}
          />
          <Skeleton className="h-32" variant="rectangular" />
          <Skeleton className="h-32" variant="rectangular" />
          <Skeleton className="h-32" variant="rectangular" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.items?.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No lessons found"
          description={searchTag ? `No lessons found tagged with "${searchTag}".` : "Capture your first lesson learned to build tacit knowledge."}
          action={
            <Button onClick={() => setIsModalOpen(true)}>Capture Lesson</Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {data?.items.map((lesson) => (
            <Card key={lesson.id} className="animate-slide-up hover:border-accent-500/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-text-primary">{lesson.title}</h3>
                <span className="text-xs text-text-tertiary">{formatDate(lesson.created_at)}</span>
              </div>
              
              <p className="text-sm text-text-secondary leading-relaxed mb-4 whitespace-pre-wrap">
                {lesson.content}
              </p>
              
              <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-border-secondary">
                <div className="flex items-center gap-1 text-xs text-text-tertiary">
                  <span>By {lesson.author}</span>
                </div>
                {lesson.equipment_tag && (
                  <Badge variant="accent" className="font-mono text-[10px]">
                    {lesson.equipment_tag}
                  </Badge>
                )}
                <div className="flex flex-wrap gap-1">
                  {lesson.tags.map((tag) => (
                    <Badge key={tag} variant="default" className="text-[10px] bg-surface-secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !createMutation.isPending && setIsModalOpen(false)}
        title="Capture Lesson Learned"
        description="Share tacit knowledge, safety observations, or best practices."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Preventative measure for P-204 seal failure"
            error={errors.title?.message}
            {...register('title')}
          />
          
          <Textarea
            label="Knowledge / Observation"
            placeholder="Describe what happened, what was learned, and how it can be prevented or improved in the future..."
            className="h-32"
            error={errors.content?.message}
            {...register('content')}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Equipment Tag (Optional)"
              placeholder="e.g., P-204"
              mono
              error={errors.equipment_tag?.message}
              {...register('equipment_tag')}
            />
            
            <Input
              label="Tags (Comma separated)"
              placeholder="e.g., safety, vibration, pump"
              error={errors.tags?.message}
              {...register('tags')}
            />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border-secondary">
            <Button type="button" variant="ghost" className="mr-3" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Save Lesson
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
