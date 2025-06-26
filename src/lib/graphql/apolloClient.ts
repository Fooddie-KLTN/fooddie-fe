// apolloClient.js
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const backendUrl = process.env.NEXT_PUBLIC_API_URL_DOMAIN_BE;

// Function to get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// HTTP Link with dynamic headers function
const httpLink = new HttpLink({
  uri: `${apiBaseUrl}/graphql`,
  headers: (() => {
    const token = getToken();
    return token
      ? { Authorization: `Bearer ${token}` }
      : undefined;
  })(),
});

// WebSocket link with token
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
      url: `ws://${backendUrl}/graphql`,
      connectionParams: () => {
        const token = getToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
      on: {
        connected: () => console.log('📶 WebSocket connected successfully'),
        error: (err) => console.error('📶 WebSocket error:', err),
      }
    }))
  : null;

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink,
  )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});