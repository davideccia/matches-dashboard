import { authTokenStorage } from '~/utils/authToken'
import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neutral',
      secondary: 'neutral',
      neutral: 'neutral',
    },

  },
  sanctum: {
    tokenStorage: authTokenStorage,
  },
  version: pkg.version,
})
