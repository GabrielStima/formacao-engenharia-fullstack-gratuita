import { Marked } from 'marked';
import { dirname, join, normalize } from 'node:path';
import sanitizeHtml from 'sanitize-html';

const slug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/<[^>]+>/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export function renderMarkdown(markdown, {
  sourcePath,
  contentLookup,
  assetUrlFor,
  sourceUrlFor,
}) {
  const marked = new Marked({
    async: false,
    gfm: true,
    pedantic: false,
  });

  marked.use({
    renderer: {
      blockquote({ tokens }) {
        const firstInlineToken = tokens[0]?.tokens?.[0];
        const alert = firstInlineToken?.text?.match(
          /^\[!(info|warning)\]\s*\n?/i,
        );

        if (!alert) {
          return `<blockquote>\n${this.parser.parse(tokens)}</blockquote>\n`;
        }

        const marker = alert[0];
        const bodyTokens = tokens.map((token, tokenIndex) => {
          if (tokenIndex !== 0) return token;

          return {
            ...token,
            tokens: token.tokens.map((inlineToken, inlineIndex) => (
              inlineIndex === 0
                ? {
                    ...inlineToken,
                    raw: inlineToken.raw.replace(marker, ''),
                    text: inlineToken.text.replace(marker, ''),
                  }
                : inlineToken
            )),
          };
        });
        const type = alert[1].toLowerCase();

        return [
          `<aside class="markdown-alert markdown-alert-${type}" role="note">`,
          `<strong>${type.toUpperCase()}</strong>`,
          this.parser.parse(bodyTokens),
          '</aside>',
        ].join('\n');
      },
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slug(text);

        return [
          `<h${depth} id="${id}">`,
          text,
          `<a class="heading-anchor" href="#${id}" aria-label="Link para esta seção">#</a>`,
          `</h${depth}>`,
        ].join('');
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttribute = title ? ` title="${title}"` : '';

        if (/^https?:\/\//i.test(href)) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttribute}>${text}</a>`;
        }

        if (href.endsWith('.md')) {
          const target = normalize(join(dirname(sourcePath), href));
          const content = contentLookup.get(target);

          if (content?.kind === 'lesson') {
            return `<a href="?aula=${content.slug}" data-lesson-slug="${content.slug}">${text}</a>`;
          }

          if (content?.kind === 'exercise') {
            return `<a href="?exercicio=${content.slug}" data-exercise-slug="${content.slug}">${text}</a>`;
          }

          return `<a href="${sourceUrlFor(target)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }

        return `<a href="${href}"${titleAttribute}>${text}</a>`;
      },
      image({ href, title, text }) {
        const source = /^https?:\/\//i.test(href)
          ? href
          : assetUrlFor(normalize(join(dirname(sourcePath), href)));
        const titleAttribute = title ? ` title="${title}"` : '';

        return `<img src="${source}" alt="${text}" loading="lazy"${titleAttribute}>`;
      },
    },
  });

  const html = marked.parse(markdown);

  return sanitizeHtml(html, {
    allowedTags: [
      'a',
      'aside',
      'blockquote',
      'br',
      'code',
      'del',
      'details',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'img',
      'input',
      'li',
      'ol',
      'p',
      'pre',
      'span',
      'strong',
      'summary',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'role'],
      a: [
        'href',
        'title',
        'target',
        'rel',
        'aria-label',
        'data-lesson-slug',
        'data-exercise-slug',
      ],
      img: ['src', 'alt', 'title', 'loading'],
      input: ['type', 'checked', 'disabled'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option'],
  });
}
