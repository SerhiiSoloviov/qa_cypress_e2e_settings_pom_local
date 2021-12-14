import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";

import ArticlePreview from "components/article/ArticlePreview";
import ErrorMessage from "components/common/ErrorMessage";
import { FavoriteArticleButtonContext } from "components/common/FavoriteArticleButton";
import LoadingSpinner from "components/common/LoadingSpinner";
import Maybe from "components/common/Maybe";
import Pagination from "components/common/Pagination";
import { SERVER_BASE_URL, DEFAULT_LIMIT } from "lib/utils/constant";
import fetcher from "lib/utils/fetcher";
import { AppContext } from "libts";

const ArticleList = props => {
  const { page, setPage } = props
  const router = useRouter();
  const { asPath, pathname, query } = router;
  const { favorite, follow, tag, pid } = query;
  let fetchURL = (() => {
    switch (props.what) {
      case 'favorites':
        return `${SERVER_BASE_URL}/articles?limit=${DEFAULT_LIMIT}&favorited=${encodeURIComponent(
          String(pid)
        )}&offset=${page * DEFAULT_LIMIT}`
      case 'my-posts':
        return `${SERVER_BASE_URL}/articles?limit=${DEFAULT_LIMIT}&author=${encodeURIComponent(
          String(pid)
        )}&offset=${page * DEFAULT_LIMIT}`;
      case 'tag':
        return `${SERVER_BASE_URL}/articles?limit=${DEFAULT_LIMIT}&tag=${encodeURIComponent(props.tag)}&offset=${
          page * DEFAULT_LIMIT
        }`;
      case 'feed':
        return `${SERVER_BASE_URL}/articles/feed?limit=${DEFAULT_LIMIT}&offset=${
          page * DEFAULT_LIMIT
        }`;
      case 'global':
        return `${SERVER_BASE_URL}/articles?limit=${DEFAULT_LIMIT}&offset=${page * DEFAULT_LIMIT}`;
      default:
        throw new Error(`Unknown search: ${props.what}`)
    }
  })()
  const { data, error } = useSWR(fetchURL, fetcher());
  const { articles, articlesCount } = data || {
    articles: props.articles || [],
    articlesCount: props.articlesCount || 0,
  };

  // Favorite article button state.
  const favorited = []
  const setFavorited = []
  const favoritesCount = []
  const setFavoritesCount = []
  const nArticles = articles?.length || 0
  for (let i = 0; i < nArticles; i++) {
      [favorited[i], setFavorited[i]] = React.useState(false);
      [favoritesCount[i], setFavoritesCount[i]] = React.useState(0);
  }
  React.useEffect(() => {
    for (let i = 0; i < nArticles; i++) {
      setFavorited[i](articles[i].favorited);
      setFavoritesCount[i](articles[i].favoritesCount);
    }
  }, [articles])

  if (error) return <ErrorMessage message="Cannot load recent articles..." />;
  if (articles?.length === 0) {
    return (<div className="article-preview">No articles are here... yet.</div>);
  }
  return (
    <>
      {articles?.map((article, i) => (
        <FavoriteArticleButtonContext.Provider key={article.slug} value={{
          favorited: favorited[i],
          setFavorited: setFavorited[i],
          favoritesCount: favoritesCount[i],
          setFavoritesCount: setFavoritesCount[i],
        }}>
          <ArticlePreview key={article.slug} article={article} />
        </FavoriteArticleButtonContext.Provider>
      ))}
      <Maybe test={articlesCount && articlesCount > DEFAULT_LIMIT}>
        <Pagination
          articlesCount={articlesCount}
          articlesPerPage={DEFAULT_LIMIT}
          showPagesMax={10}
          currentPage={page}
          setCurrentPage={setPage}
          fetchURL={fetchURL}
        />
      </Maybe>
    </>
  );
};

export default ArticleList;
