require('reflect-metadata'); // Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905

// Mock all fetch calls
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();
