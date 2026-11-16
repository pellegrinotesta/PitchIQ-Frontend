import { apiUrl } from './api-url';

describe('apiUrl', () => {
  const globale = globalThis as { __PITCHIQ__?: unknown };
  afterEach(() => delete globale.__PITCHIQ__);

  it('usa l\'indirizzo di sviluppo se manca la configurazione', () => {
    expect(apiUrl()).toBe('http://localhost:8080/api');
    globale.__PITCHIQ__ = { apiUrl: '  ' };
    expect(apiUrl()).toBe('http://localhost:8080/api');
    globale.__PITCHIQ__ = { apiUrl: 42 };
    expect(apiUrl()).toBe('http://localhost:8080/api');
  });

  it('usa l\'indirizzo configurato senza barra finale', () => {
    globale.__PITCHIQ__ = { apiUrl: 'https://pitchiq.example.it/api/' };
    expect(apiUrl()).toBe('https://pitchiq.example.it/api');
    globale.__PITCHIQ__ = { apiUrl: '/api' };
    expect(apiUrl()).toBe('/api');
  });
});
