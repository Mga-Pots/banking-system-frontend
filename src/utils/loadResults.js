// Page loads with Promise.allSettled: every call becomes a section of the page,
// { status: 'loading' | 'ready' | 'error', data, error }, so one failed call only
// breaks the part of the page that needs it.

export const messageOf = (err) => err.response?.data?.message ?? err.message

export const LOADING = { status: 'loading', data: null, error: '' }

// Runs the api calls together and never throws.
export const settle = async (calls) =>
  (await Promise.allSettled(calls)).map((result) =>
    result.status === 'fulfilled'
      ? { status: 'ready', data: result.value.data, error: '' }
      : { status: 'error', data: null, error: messageOf(result.reason) },
  )

// A failed refresh keeps the data the section already had, so it doesn't blank out.
export const keepData = (previous, next) =>
  next.status === 'error' && previous?.data ? { ...next, data: previous.data } : next

// Before a retry: sections with nothing to show go back to their skeleton.
export const retrying = (sections) =>
  Object.fromEntries(Object.entries(sections).map(([key, section]) => [key, section.data ? section : LOADING]))

// One state for a part of the page that needs several calls: loading while any is,
// failed if any has nothing to show.
export const combine = (...sections) =>
  sections.find((s) => s.status === 'loading') ??
  sections.find((s) => !s.data) ?? { status: 'ready', data: true, error: '' }
