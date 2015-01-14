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

VERSION = `./version`.chomp
dirty = `git status 2> /dev/null | tail -n1`.chomp != 'nothing to commit, working directory clean'
CHANNEL = dirty ? 'dirty' : `git rev-parse --abbrev-ref HEAD`.chomp
CLOUDFRONT_HOST = 'd1gvo455cekpjp.cloudfront.net'
LABEL = "heroku-cli/#{VERSION} (#{CHANNEL})"
REVISION=`git log -n 1 --pretty=format:"%H"`

desc "build heroku-cli"
task :build do
  puts "building  #{LABEL}..."
  FileUtils.mkdir_p 'dist'
  TARGETS.map do |target|
    Thread.new do
      build(target[:os], target[:arch])
    end
  end.map(&:join)
end

desc "release heroku-cli"
task :release => :build do
  abort 'branch is dirty' if CHANNEL == 'dirty'
  abort "#{CHANNEL} not a channel branch (dev/master)" unless %w(dev master).include?(CHANNEL)
  puts "releasing #{LABEL}..."
  bucket = get_s3_bucket
  cache_control = "public,max-age=31536000"
  TARGETS.map do |target|
    Thread.new do
      from = "./dist/#{target[:os]}/#{target[:arch]}/heroku-cli"
      to = remote_path(target[:os], target[:arch])
      upload_file(bucket, from, to, content_type: 'binary/octet-stream', cache_control: cache_control)
      upload_file(bucket, from + '.gz', to + '.gz', content_type: 'binary/octet-stream', content_encoding: 'gzip', cache_control: cache_control)
      upload_string(bucket, from, to + ".sha1", content_type: 'text/plain', cache_control: cache_control)
    end
  end.map(&:join)
  upload_manifest(bucket)
  notify_rollbar
  puts "released #{VERSION}"
end

def build(os, arch)
  path = "./dist/#{os}/#{arch}/heroku-cli"
  ldflags = "-X main.Version #{VERSION} -X main.Channel #{CHANNEL}"
  args = "-o #{path} -ldflags \"#{ldflags}\""
  system("GOOS=#{os} GOARCH=#{arch} go build #{args}")
  gzip(path)
end

def gzip(path)
  system("gzip --keep -f #{path}")
end

def sha_digest(path)
  Digest::SHA1.file(path).hexdigest
end

def remote_path(os, arch)
  "heroku-cli/#{CHANNEL}/#{VERSION}/#{os}/#{arch}/heroku-cli"
end

def remote_url(os, arch)
  "https://#{CLOUDFRONT_HOST}/#{remote_path(os, arch)}"
end

def manifest
  return @manifest if @manifest
  @manifest = {
    released_at: Time.now,
    version: VERSION,
    channel: CHANNEL,
    builds: {}
  }
  TARGETS.each do |target|
    @manifest[:builds][target[:os]] ||= {}
    @manifest[:builds][target[:os]][target[:arch]] = {
      url: remote_url(target[:os], target[:arch]),
      sha1: sha_digest("dist/#{target[:os]}/#{target[:arch]}/heroku-cli")
    }
  end

  @manifest
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

def upload_manifest(bucket)
  puts 'uploading manifest...'
  upload_string(bucket, JSON.dump(manifest), "heroku-cli/#{CHANNEL}/manifest.json", content_type: 'application/json', cache_control: "public,max-age=300")
end

def notify_rollbar
  unless ENV['ROLLBAR_TOKEN']
    $stderr.puts 'ROLLBAR_TOKEN not set, skipping rollbar deploy notification'
    return
  end
  Net::HTTP.post_form(URI.parse('https://api.rollbar.com/api/1/deploy/'),
                      environment: CHANNEL,
                      local_username: `whoami`.chomp,
                      revision: REVISION,
                      access_token: ENV['ROLLBAR_TOKEN'])
end
