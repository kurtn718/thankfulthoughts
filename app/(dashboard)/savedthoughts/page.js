'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';

export default function SavedThoughtsPage() {
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
    if (!confirm('Are you sure you want to delete this thought?')) return;

    try {
      const response = await fetch(`/api/savedthoughts?id=${thoughtId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      const result = await response.json();

      if (!result.success) {
        alert('Failed to delete thought');
        return;
      }

      // Refresh the current page
      fetchThoughts(state.pagination.currentPage, searchTerm);
    } catch (error) {
      alert('Failed to delete thought');
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
            <h1 className="text-5xl font-bold">Hello there</h1>
            <p className="py-6">Please sign in to view your saved thoughts.</p>
            <Link href="/sign-in" className="btn btn-primary">
              Sign In
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
          <h3 className="font-bold">Error!</h3>
          <div className="text-xs">{state.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Your Saved Thoughts</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="search"
            placeholder="Search thoughts..."
            className="input input-bordered w-full md:w-80"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Link href="/createthought" className="btn btn-primary whitespace-nowrap">
            Create New
          </Link>
        </div>
      </div>

      {/* Thoughts Grid */}
      {state.thoughts.length === 0 ? (
        <div className="hero min-h-[50vh] bg-base-100 rounded-box">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold">
                {searchTerm ? 'No matching thoughts found' : 'No thoughts yet'}
              </h2>
              <p className="py-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start by creating your first thankful thought!'}
              </p>
              {!searchTerm && (
                <Link href="/createthought" className="btn btn-primary">
                  Create Thought
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
                          <span className="label-text">To:</span>
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
                          <span className="label-text">Message:</span>
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
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    // View Mode
                    <>
                      <h2 className="card-title">To: {thought.personName}</h2>
                      <p className="whitespace-pre-wrap">{thought.message}</p>
                      <div className="card-actions justify-between items-center mt-4">
                        <div className="text-sm opacity-70">
                          {new Date(thought.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingThought(thought.id)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDelete(thought.id)}
                          >
                            Delete
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
    </div>
  );
}