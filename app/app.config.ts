import { authTokenStorage } from '~/utils/authToken'
import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'yellow',
      neutral: 'neutral',
    },

  },
  sanctum: {
    tokenStorage: authTokenStorage,
  },
  version: pkg.version,
})
