import { createMachine } from 'xstate';

import { Fic } from './sites/site.js';

const machine = createMachine(
  {
    context: {
      app: {
        agent: '',
        cache: true,
        debug: false,
      },
      error: null,
      fic: {
        author: {
          text: '',
          url: null,
        },
        chapters: [],
        cover: null,
        description: '',
        id: '',
        images: [],
        published: '',
        publisher: '',
        tags: [],
        title: '',
        updated: '',
        words: 0,
      },
    },
    id: 'fic-gen-machine',
    initial: 'Empty',
    states: {
      Downloading: {
        always: [
          {
            guard: 'successful-download',
            target: 'Ready',
          },
          {
            target: 'End',
          },
        ],
      },
      Empty: {
        always: [{ target: 'Initialized' }],
      },
      End: {
        type: 'final',
      },
      GettingChapter: {},
      GettingChapterList: {
        on: {
          'get-chapter': [
            {
              guard: 'failed-getting-chapter-list',
              target: 'End',
            },
            {
              guard: 'has-more-chapters',
              target: 'GettingChapter',
            },
            {
              target: 'UnparsedData',
            },
          ],
        },
      },
      Initialized: {
        on: {
          ready: [
            {
              guard: 'has-curl',
              target: 'Ready',
            },
            {
              target: 'Setup',
            },
          ],
        },
      },
      Ready: {
        on: {
          'get-site': [
            {
              guard: 'found-site',
              target: 'SiteReady',
            },
            {
              target: 'End',
            },
          ],
        },
      },
      Setup: {
        on: {
          'download-curl': {
            target: 'Downloading',
          },
        },
      },
      SiteReady: {
        on: {
          'get-chapter-list': {
            target: 'GettingChapterList',
          },
        },
      },
      UnparsedData: {},
    },
    types: {
      context: {} as {
        app: {
          debug: boolean;
          cache: boolean;
          agent: string;
        };
        error: Error | null;
        fic: Fic;
      },
      events: {} as
        | { type: 'ready' }
        | { type: 'get-site' }
        | { type: 'download-curl' }
        | { type: 'get-chapter-list' }
        | { type: 'get-chapter' },
    },
  },
  {
    actions: {},
    actors: {},
    delays: {},
    guards: {
      'failed-getting-chapter-list': ({ context, event }, params) => false,
      'found-site': ({ context, event }, params) => false,
      'has-curl': ({ context, event }, params) => false,
      'has-more-chapters': ({ context, event }, params) => false,
      'successful-download': ({ context, event }, params) => false,
    },
  },
);

export { machine };
