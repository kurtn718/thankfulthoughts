'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import { useTranslation } from '@/hooks/useTranslation';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

// Create a separate component for the search functionality
function ThoughtsList() {
  const { t, locale } = useTranslation();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState({
    thoughts: [],
    loading: true,
    error: null,
    pagination: {
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: 9
    }
  });

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [editingThought, setEditingThought] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchThoughts = useCallback(async (page = 1, search = '') => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: state.pagination.limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/savedthoughts?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: result.error,
          loading: false
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        thoughts: result.data,
        pagination: result.pagination,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Failed to fetch thoughts:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load thoughts',
        loading: false
      }));
    }
  }, [user, state.pagination.limit]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((search) => {
      const newParams = new URLSearchParams(searchParams);
      if (search) {
        newParams.set('search', search);
      } else {
        newParams.delete('search');
      }
      router.replace(`/savedthoughts?${newParams.toString()}`, { scroll: false });
      fetchThoughts(1, search);
    }, 300),
    [fetchThoughts, router, searchParams]
  );

  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle deletion
  const handleDelete = async (thoughtId) => {
    setDeleteId(thoughtId);
  };

  // Add confirmDelete handler
  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/savedthoughts?id=${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      const result = await response.json();

      if (!result.success) {
        alert(t('savedThoughts.error'));
        return;
      }

      fetchThoughts(state.pagination.currentPage, searchTerm);
    } catch (error) {
      alert(t('savedThoughts.error'));
    } finally {
      setDeleteId(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    router.replace(`/savedthoughts?${newParams.toString()}`, { scroll: false });
    fetchThoughts(page, searchTerm);
  };

  const handleUpdate = async (thoughtId, updatedData) => {
    try {
      const response = await fetch(`/api/savedthoughts?id=${thoughtId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();

      if (!result.success) {
        alert('Failed to update thought');
        return;
      }

      // Refresh the current page
      fetchThoughts(state.pagination.currentPage, searchTerm);
      setEditingThought(null); // Close edit mode
    } catch (error) {
      alert('Failed to update thought');
    }
  };

  // Format date according to locale
  const formatDate = (date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchThoughts(1, searchParams.get('search') || '');
    }
  }, [isLoaded, user, fetchThoughts, searchParams]);

  if (!isLoaded || state.loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hero min-h-[50vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t('savedThoughts.signIn.title')}</h1>
            <p className="py-6">{t('savedThoughts.signIn.message')}</p>
            <Link href="/sign-in" className="btn btn-primary">
              {t('savedThoughts.signIn.button')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold">{t('savedThoughts.error')}!</h3>
          <div className="text-xs">{state.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">{t('savedThoughts.title')}</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="search"
            placeholder={t('savedThoughts.search.placeholder')}
            className="input input-bordered w-full md:w-80"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Link href="/createthought" className="btn btn-primary whitespace-nowrap">
            {t('savedThoughts.createNew')}
          </Link>
        </div>
      </div>

      {/* Thoughts Grid */}
      {state.thoughts.length === 0 ? (
        <div className="hero min-h-[50vh] bg-base-100 rounded-box">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold">
                {searchTerm ? t('savedThoughts.search.noResults') : t('savedThoughts.empty')}
              </h2>
              <p className="py-6">
                {searchTerm 
                  ? t('savedThoughts.search.adjustSearch')
                  : t('savedThoughts.createFirst')}
              </p>
              {!searchTerm && (
                <Link href="/createthought" className="btn btn-primary">
                  {t('savedThoughts.createButton')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {state.thoughts.map((thought) => (
              <div key={thought.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  {editingThought === thought.id ? (
                    // Edit Mode
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        handleUpdate(thought.id, {
                          personName: formData.get('personName'),
                          message: formData.get('message')
                        });
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="label">
                          <span className="label-text">{t('savedThoughts.card.to')}:</span>
                        </label>
                        <input
                          type="text"
                          name="personName"
                          defaultValue={thought.personName}
                          className="input input-bordered w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">{t('savedThoughts.message')}:</span>
                        </label>
                        <textarea
                          name="message"
                          defaultValue={thought.message}
                          className="textarea textarea-bordered w-full h-24"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingThought(null)}
                        >
                          {t('savedThoughts.actions.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                        >
                          {t('savedThoughts.actions.save')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    // View Mode
                    <>
                      <h2 className="card-title">{t('savedThoughts.card.to')}: {thought.personName}</h2>
                      <p className="whitespace-pre-wrap">{thought.message}</p>
                      <div className="card-actions justify-between items-center mt-4">
                        <div className="text-sm opacity-70">
                          {formatDate(thought.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingThought(thought.id)}
                          >
                            {t('savedThoughts.actions.edit')}
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDelete(thought.id)}
                          >
                            {t('savedThoughts.actions.delete')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {state.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: state.pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`btn btn-circle ${
                    page === state.pagination.currentPage
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <DeleteConfirmModal 
        isOpen={deleteId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// Main page component with Suspense
export default function SavedThoughtsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <ThoughtsList />
    </Suspense>
  );
}