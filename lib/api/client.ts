import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from '../types/api';

// Create a fetcher instance for the OpenAPI spec
type MooovesPaths = paths;

export const api = Fetcher.for<MooovesPaths>();

// Optionally, set a base URL for all requests
api.configure({ baseUrl: 'https://mooves.onrender.com/Mooves' });
