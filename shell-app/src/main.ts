import { initFederation } from '@angular-architects/native-federation';
import federationManifest from '../public/federation.manifest.json';

initFederation(federationManifest)
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));