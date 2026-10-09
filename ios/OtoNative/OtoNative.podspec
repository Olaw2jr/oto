# oto's own native iOS modules, kept in a local pod so the Xcode project file
# doesn't need hand edits.
Pod::Spec.new do |s|
  s.name         = 'OtoNative'
  s.version      = '0.0.1'
  s.summary      = "oto's native iOS modules"
  s.homepage     = 'https://github.com/Olaw2jr/oto'
  s.license      = {type: 'Proprietary'}
  s.authors      = 'oto'
  s.platforms    = {ios: '15.1'}
  s.source       = {git: 'https://github.com/Olaw2jr/oto.git'}
  s.source_files = '*.{h,m}'

  install_modules_dependencies(s)
end
