source "https://rubygems.org"

gem "jekyll-theme-chirpy", "~> 7.0", ">= 7.0.1"

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem 'wdm', '>= 0.1.0' if Gem.win_platform?

# Avoid error sass error messages
gem 'sass-embedded', '= 1.77.5'