require 'digest'
require 'aws-sdk'

BUCKET_NAME = 'heroku-cli'

TARGETS = [
  {os: 'darwin', arch: '386'},
  {os: 'darwin', arch: 'amd64'},
  {os: 'linux', arch: 'amd64'},
  {os: 'linux', arch: '386'},
  {os: 'windows', arch: 'amd64'},
  {os: 'windows', arch: '386'}
]

ENV['AWS_ACCESS_KEY_ID'] = ENV['HEROKU_RELEASE_ACCESS']
ENV['AWS_SECRET_ACCESS_KEY'] = ENV['HEROKU_RELEASE_SECRET']

VERSION = `./version.sh`.chomp
dirty = `git status 2> /dev/null | tail -n1`.chomp != 'nothing to commit, working directory clean'
CHANNEL = dirty ? 'dirty' : `git rev-parse --abbrev-ref HEAD`.chomp
CLOUDFRONT_HOST = 'd1gvo455cekpjp.cloudfront.net'

puts "hk: #{VERSION}"

desc "build hk"
task :build do
  FileUtils.mkdir_p 'dist'
  TARGETS.each do |target|
    path = "./dist/hk_#{target[:os]}_#{target[:arch]}"
    puts "building #{path}"
    build(target[:os], target[:arch], path)
    gzip(path)
  end
end

desc "deploy hk"
task :deploy => :build do
  abort 'branch is dirty' if CHANNEL == 'dirty'
  abort "#{CHANNEL} not a channel branch (dev/release)" unless %w(dev release).include?(CHANNEL)
  puts "deploying #{VERSION} to #{BUCKET_NAME}.s3.amazonaws.com/hk/#{CHANNEL}..."
  bucket = get_s3_bucket
  cache_control = "public,max-age=31536000"
  TARGETS.each do |target|
    from = "./dist/#{filename(target[:os], target[:arch])}"
    to = remote_path(target[:os], target[:arch])
    puts "upload #{to}"
    upload_file(bucket, from, to, content_type: 'binary/octet-stream', cache_control: cache_control)
    upload_file(bucket, from + '.gz', to + '.gz', content_type: 'binary/octet-stream', content_encoding: 'gzip', cache_control: cache_control)
    upload_string(bucket, from, to + ".sha1", content_type: 'text/plain', cache_control: cache_control)
  end
  set_manifest(bucket)
end

def build(os, arch, path)
  ldflags = "-X main.Version #{VERSION} -X main.Channel #{CHANNEL}"
  args = "-o #{path} -ldflags \"#{ldflags}\""
  system("GOOS=#{os} GOARCH=#{arch} go build #{args}")
end

def gzip(path)
  system("gzip --keep -f #{path}")
end

def sha_digest(path)
  Digest::SHA1.file(path).hexdigest
end

def get_s3_bucket
  s3 = AWS::S3.new(region: 'us-west-2', access_key_id: ENV['HEROKU_RELEASE_ACCESS'], secret_access_key: ENV['HEROKU_RELEASE_SECRET'])
  s3.buckets[BUCKET_NAME]
end

def upload_file(bucket, local, remote, opts={})
  obj = bucket.objects[remote]
  obj.write(Pathname.new(local), opts)
  obj.acl = :public_read
end

def upload_string(bucket, s, remote, opts={})
  obj = bucket.objects[remote]
  obj.write(s, opts)
  obj.acl = :public_read
end

def filename(os, arch)
  "hk_#{os}_#{arch}"
end

def remote_path(os, arch)
  "hk/#{CHANNEL}/#{VERSION}/#{filename(os, arch)}"
end

def remote_url(os, arch)
  "https://#{CLOUDFRONT_HOST}/#{remote_path(os, arch)}"
end

def manifest
  return @manifest if @manifest
  @manifest = {
    deployed_at: Time.now,
    version: VERSION,
    channel: CHANNEL,
    builds: {}
  }
  TARGETS.each do |target|
    @manifest[:builds][target[:os]] ||= {}
    @manifest[:builds][target[:os]][target[:arch]] = {
      url: remote_url(target[:os], target[:arch]),
      sha1: sha_digest("dist/hk_#{target[:os]}_#{target[:arch]}")
    }
  end
  @manifest
end

def set_manifest(bucket)
  puts 'setting manifest:'
  p manifest
  upload_string(bucket, JSON.dump(manifest), "hk/#{CHANNEL}/manifest.json", content_type: 'application/json', cache_control: "public,max-age=300")
  puts "deployed #{VERSION}"
end
