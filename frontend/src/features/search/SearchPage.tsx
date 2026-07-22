/** Search Page — hybrid semantic + keyword search (SRD FR-4, 7.7) */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Search as SearchIcon, FileText, Sparkles, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { ProgressBar } from '@/components/ui/Progress';
import { searchApi } from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SearchResult, SearchRequest } from '@/types/api';
import { cn, getDocTypeColor } from '@/utils';
import { ErrorState } from '@/components/ui/ErrorState';

const DOC_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'SOP', label: 'SOP' },
  { value: 'Inspection Report', label: 'Inspection Report' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Incident Report', label: 'Incident Report' },
  { value: 'Work Order', label: 'Work Order' },
];

/** Search page with AI-search styling and ranked results */
export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = React.useState(false);
  const [docType, setDocType] = React.useState('');
  const [equipTag, setEquipTag] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);

  const searchMutation = useMutation({
    mutationFn: (req: SearchRequest) => searchApi.search(req),
    onSuccess: (data) => {
      setResults(data.results);
    },
  });

  const handleSearch = () => {
    if (query.trim().length === 0) return;
    if (query.length > 500) return;

    setSearchParams({ q: query });
    searchMutation.mutate({
      query: query.trim(),
      filters: {
        ...(docType && { document_type: docType }),
        ...(equipTag && { equipment_tag: equipTag }),
      },
      top_k: 10,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div>
      <PageHeader
        title="Search Knowledge Base"
        description="Hybrid semantic + keyword search across all indexed documents"
      />

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className={cn(
          'relative group',
          'rounded-xl border-2 bg-surface-primary',
          'transition-all duration-normal',
          'border-border-primary focus-within:border-accent-500/50 focus-within:shadow-lg focus-within:shadow-accent-500/5'
        )}>
          <div className="flex items-center gap-3 px-4">
            <Sparkles className="h-5 w-5 text-accent-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              className="flex-1 h-12 bg-transparent text-base text-text-primary placeholder:text-text-tertiary outline-none"
              maxLength={500}
              aria-label="Search query"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  showFilters ? 'text-accent-500 bg-accent-500/10' : 'text-text-tertiary hover:text-text-secondary'
                )}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <Button onClick={handleSearch} loading={searchMutation.isPending} size="sm">
                <SearchIcon className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-border-secondary px-4 py-3 flex flex-wrap gap-3 animate-slide-up">
              <Select
                options={DOC_TYPE_OPTIONS.slice(1)}
                placeholder="Document Type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                selectSize="sm"
              />
              <Input
                placeholder="Equipment tag..."
                mono
                value={equipTag}
                onChange={(e) => setEquipTag(e.target.value)}
                className="w-32 !h-8 !text-xs"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-text-tertiary text-center mt-2">
          {query.length}/500 characters
        </p>
      </div>

      {/* Results */}
      <div className="relative">
      <LoadingExperience 
        isLoading={searchMutation.isPending} 
        variant="search"
        messages={[
          'Searching through connected knowledge...',
          'Generating semantic embeddings...',
          'Ranking relevance...'
        ]}
      />
      {searchMutation.isPending ? (
        <div className="max-w-3xl mx-auto space-y-3 min-h-[300px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" variant="rectangular" />
          ))}
        </div>
      ) : searchMutation.isError ? (
        <div className="max-w-3xl mx-auto">
          <ErrorState 
            title="Search Failed" 
            message="Cannot reach the search API to fetch results." 
            onRetry={handleSearch} 
          />
        </div>
      ) : results.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-sm text-text-secondary mb-4">
            Found <span className="font-medium text-text-primary">{results.length}</span> results
          </p>
          {results.map((result, i) => (
            <Card
              key={result.chunk_id}
              hover
              onClick={() => navigate(`/documents/${result.document_id}?page=${result.page_number}&chunk=${result.chunk_id}`)}
              className="animate-slide-up"
              padding="none"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                    <span className="text-sm font-medium text-text-primary">{result.filename}</span>
                    <Badge variant="default" className="text-[10px]">Page {result.page_number}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={result.score * 100} className="w-16" size="sm" />
                    <span className="text-xs font-mono text-text-tertiary">{(result.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {result.snippet}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : searchMutation.isSuccess ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No results found"
          description="Try a different phrasing or check your filters. The search combines semantic understanding with keyword matching."
        />
      ) : null}
      </div>
    </div>
  );
}
