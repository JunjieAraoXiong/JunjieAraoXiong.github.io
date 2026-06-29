source "https://rubygems.org"

# Jekyll + the plugins used in _config.yml. GitHub Pages builds the live
# site with its own pinned environment; this Gemfile is for local dev
# (`bundle exec jekyll serve`) and the Lighthouse CI build.
gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-sitemap"
end

# Needed on Ruby 3.4+ where these were removed from the default gems.
gem "csv"
gem "base64"
gem "bigdecimal"
