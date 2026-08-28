import { authTokenStorage } from '~/utils/authToken'
import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      secondary: 'blue',
      neutral: 'mist',
    },

  },
  sanctum: {
    tokenStorage: authTokenStorage,
  },
  version: pkg.version,
})
