const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItLinkAttrs = require("markdown-it-link-attributes");

module.exports = function(eleventyConfig) {
  // Add syntax highlighting plugin
  eleventyConfig.addPlugin(syntaxHighlight);

  // Configure Markdown-it with attrs and link-attributes plugins
  const markdownLib = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true
  })
  .use(markdownItAttrs)
  .use(markdownItLinkAttrs, {
    pattern: /^https?:\/\//,
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  });

  eleventyConfig.setLibrary("md", markdownLib);

  // Add posts collection sorted by date (newest first)
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("posts/**/*.md").sort((a, b) => {
      return b.date - a.date; // Newest first
    });
  });

  // Add date filter for readable date formatting
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Add date filter for HTML datetime attribute
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return new Date(dateObj).toISOString().split('T')[0];
  });

  // Return configuration
  return {
    dir: {
      input: "posts",
      output: "public/blog",
      includes: "../_includes",
      data: "../_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
