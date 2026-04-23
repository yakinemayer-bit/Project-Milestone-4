// ====== CONFIG ======
const TMDB_API_KEY = 'b66820c2c194286755bb49fe79e9227b'; // your key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w200';

const RESULTS_PER_VIEW = 10;
const MAX_RESULTS = 50;

// State for search
let searchState = {
  query: '',
  viewPage: 1,
  totalResults: 0,
  movies: []
};

// State for collection
let collectionState = {
  page: 1,
  totalResults: 0,
  movies: []
};

// Current layout: 'grid' or 'list'
let currentView = 'grid';

$(document).ready(function () {
  // Nav
  $('#nav-search').on('click', function () {
    setNav('search');
  });

  $('#nav-collection').on('click', function () {
    setNav('collection');
    if (!collectionState.movies.length) {
      loadCollection(1);
    }
  });

  // View toggle
  $('#view-grid').on('click', function () {
    setView('grid');
  });

  $('#view-list').on('click', function () {
    setView('list');
  });

  // Search
  $('#btnSearch').on('click', function () {
    const term = $('#searchTerm').val().trim();
    if (!term) {
      $('#search-results').html('<p>Please enter a movie title.</p>');
      $('#search-pagination').hide();
      return;
    }
    searchMovies(term);
  });

  $('#search-prev').on('click', function () {
    changeSearchViewPage(searchState.viewPage - 1);
  });

  $('#search-next').on('click', function () {
    changeSearchViewPage(searchState.viewPage + 1);
  });

  // Collection pagination
  $('#collection-prev').on('click', function () {
    changeCollectionPage(collectionState.page - 1);
  });

  $('#collection-next').on('click', function () {
    changeCollectionPage(collectionState.page + 1);
  });

  // Click handlers (delegated) for items
  $('#search-results').on('click', '.movie-card, .movie-row', function () {
    const id = $(this).data('id');
    loadDetails(id);
  });

  $('#collection-results').on('click', '.movie-card, .movie-row', function () {
    const id = $(this).data('id');
    loadDetails(id);
  });
});

// ====== View / Nav helpers ======
function setNav(section) {
  if (section === 'search') {
    $('#search-section').show();
    $('#collection-section').hide();
    $('#nav-search').addClass('active');
    $('#nav-collection').removeClass('active');
  } else {
    $('#search-section').hide();
    $('#collection-section').show();
    $('#nav-search').removeClass('active');
    $('#nav-collection').addClass('active');
  }
}

function setView(view) {
  currentView = view;
  $('#view-grid').toggleClass('active', view === 'grid');
  $('#view-list').toggleClass('active', view === 'list');

  const searchContainer = $('#search-results');
  const collContainer = $('#collection-results');

  if (view === 'grid') {
    searchContainer.removeClass('list-view').addClass('grid-view');
    collContainer.removeClass('list-view').addClass('grid-view');
  } else {
    searchContainer.removeClass('grid-view').addClass('list-view');
    collContainer.removeClass('grid-view').addClass('list-view');
  }

  // Re-render current results to change template
  renderSearchPageView();
  renderCollection();
}

// ====== Search movies ======
function searchMovies(query) {
  searchState.query = query;
  searchState.viewPage = 1;

  const url = `${TMDB_BASE_URL}/search/movie`;

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY,
      query: query,
      page: 1,
      include_adult: false
    }
  }).done(function (data) {
    const results = data.results || [];
    searchState.totalResults = Math.min(data.total_results || 0, MAX_RESULTS);
    searchState.movies = results.slice(0, MAX_RESULTS);
    renderSearchPageView();
  }).fail(function () {
    $('#search-results').html('<p>Error loading search results.</p>');
    $('#search-pagination').hide();
  });
}

function changeSearchViewPage(newViewPage) {
  if (newViewPage < 1 || newViewPage > 5) return;
  searchState.viewPage = newViewPage;
  renderSearchPageView();
}

function renderSearchPageView() {
  const $container = $('#search-results');
  $container.empty();

  if (!searchState.movies.length) {
    $container.html('<p>No results found.</p>');
    $('#search-pagination').hide();
    return;
  }

  const startIndex = (searchState.viewPage - 1) * RESULTS_PER_VIEW;
  const endIndex = startIndex + RESULTS_PER_VIEW;
  const slice = searchState.movies.slice(startIndex, endIndex);

  slice.forEach(movie => {
    const viewData = prepareMovieViewData(movie);
    const html = renderMovieItem(viewData);
    $container.append(html);
  });

  $('#search-pagination').show();
  $('#search-page-info').text(`Page ${searchState.viewPage} of 5`);
  $('#search-prev').prop('disabled', searchState.viewPage === 1);
  $('#search-next').prop('disabled', searchState.viewPage === 5);
}

// ====== Collection (Popular) ======
function loadCollection(page) {
  const url = `${TMDB_BASE_URL}/movie/popular`;

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY,
      page: page
    }
  }).done(function (data) {
    collectionState.page = data.page || 1;
    collectionState.totalResults = data.total_results || 0;
    collectionState.movies = (data.results || []).slice(0, RESULTS_PER_VIEW);
    renderCollection();
  }).fail(function () {
    $('#collection-results').html('<p>Error loading popular movies.</p>');
    $('#collection-pagination').hide();
  });
}

function changeCollectionPage(newPage) {
  if (newPage < 1) return;
  loadCollection(newPage);
}

function renderCollection() {
  const $container = $('#collection-results');
  $container.empty();

  if (!collectionState.movies.length) {
    $container.html('<p>No movies found.</p>');
    $('#collection-pagination').hide();
    return;
  }

  collectionState.movies.forEach(movie => {
    const viewData = prepareMovieViewData(movie);
    const html = renderMovieItem(viewData);
    $container.append(html);
  });

  $('#collection-pagination').show();
  $('#collection-page-info').text(`TMDB page ${collectionState.page}`);
  $('#collection-prev').prop('disabled', collectionState.page === 1);
  $('#collection-next').prop('disabled', false);
}

// ====== Movie details ======
function loadDetails(movieId) {
  const url = `${TMDB_BASE_URL}/movie/${movieId}`;

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY
    }
  }).done(function (data) {
    const viewData = prepareDetailsViewData(data);
    const template = $('#movie-details-template').html();
    const html = Mustache.render(template, viewData);
    $('#details-content').html(html);
  }).fail(function () {
    $('#details-content').html('<p>Error loading movie details.</p>');
  });
}

// ====== Mustache view helpers ======
function prepareMovieViewData(movie) {
  const poster_full = movie.poster_path
    ? TMDB_IMG_BASE + movie.poster_path
    : '';

  let short_overview = movie.overview || '';
  if (short_overview.length > 120) {
    short_overview = short_overview.substring(0, 117) + '...';
  }

  return {
    id: movie.id,
    title: movie.title || 'No title',
    poster_full: poster_full,
    short_overview: short_overview || 'No overview available.',
    release_date: movie.release_date || 'Unknown',
    vote_average:
      typeof movie.vote_average === 'number'
        ? movie.vote_average.toFixed(1)
        : 'N/A',
    viewClass: currentView === 'grid' ? 'grid-item' : 'list-item'
  };
}

function renderMovieItem(viewData) {
  if (currentView === 'grid') {
    const template = $('#movie-card-template').html();
    return Mustache.render(template, viewData);
  } else {
    const template = $('#movie-list-item-template').html();
    return Mustache.render(template, viewData);
  }
}

function prepareDetailsViewData(movie) {
  const poster_full = movie.poster_path
    ? TMDB_IMG_BASE + movie.poster_path
    : '';

  return {
    title: movie.title || 'No title',
    poster_full: poster_full,
    overview: movie.overview || 'No overview available.',
    release_date: movie.release_date || 'Unknown',
    vote_average:
      typeof movie.vote_average === 'number'
        ? movie.vote_average.toFixed(1)
        : 'N/A',
    original_language: movie.original_language || 'N/A',
    runtime: movie.runtime || 'N/A'
  };
}