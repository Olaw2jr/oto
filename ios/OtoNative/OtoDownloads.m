#import "OtoDownloads.h"

#import <React/RCTBridgeModule.h>

NSString *const OtoDownloadsBackgroundEvents = @"OtoDownloadsBackgroundEvents";

static NSString *const SessionIdentifier = @"tz.co.oto.downloads";
static NSString *const Event = @"oto-downloads";

// Downloads chapters with a background URLSession so they continue while oto
// is suspended. Finished files live in Application Support/oto-downloads,
// excluded from iCloud backups, and play as local files. A small JSON index
// keeps each download's metadata and state.
@implementation OtoDownloads {
  NSURLSession *_session;
  NSMutableDictionary<NSString *, NSMutableDictionary *> *_index;
  BOOL _wifiOnly;
  BOOL _hasListeners;
  void (^_backgroundCompletion)(void);
  NSDate *_lastProgress;
  dispatch_queue_t _queue;
}

RCT_EXPORT_MODULE(OtoDownloads)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _queue = dispatch_queue_create("tz.co.oto.downloads", DISPATCH_QUEUE_SERIAL);
    _wifiOnly = YES;
    _index = [self loadIndex];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(backgroundEvents:)
                                                 name:OtoDownloadsBackgroundEvents
                                               object:nil];
    [self session];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ Event ];
}

- (void)startObserving
{
  _hasListeners = YES;
}

- (void)stopObserving
{
  _hasListeners = NO;
}

#pragma mark - Storage

- (NSURL *)directory
{
  NSURL *support = [[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory
                                                          inDomains:NSUserDomainMask].firstObject;
  NSURL *directory = [support URLByAppendingPathComponent:@"oto-downloads" isDirectory:YES];
  [[NSFileManager defaultManager] createDirectoryAtURL:directory
                           withIntermediateDirectories:YES
                                            attributes:nil
                                                 error:nil];
  [directory setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
  return directory;
}

- (NSURL *)indexURL
{
  return [[self directory] URLByAppendingPathComponent:@"index.json"];
}

- (NSMutableDictionary *)loadIndex
{
  NSData *data = [NSData dataWithContentsOfURL:[self indexURL]];
  NSDictionary *saved = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  NSMutableDictionary *index = [NSMutableDictionary dictionary];
  [saved enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSDictionary *entry, BOOL *stop) {
    index[key] = [entry mutableCopy];
  }];
  return index;
}

- (void)saveIndex
{
  NSData *data = [NSJSONSerialization dataWithJSONObject:_index options:0 error:nil];
  [data writeToURL:[self indexURL] atomically:YES];
}

#pragma mark - Session

- (NSURLSession *)session
{
  if (!_session) {
    NSURLSessionConfiguration *configuration =
        [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:SessionIdentifier];
    configuration.sessionSendsLaunchEvents = YES;
    configuration.discretionary = NO;
    _session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
  }
  return _session;
}

- (void)backgroundEvents:(NSNotification *)notification
{
  void (^completion)(void) = notification.userInfo[@"completionHandler"];
  dispatch_async(_queue, ^{
    self->_backgroundCompletion = completion;
  });
}

- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session
{
  dispatch_async(_queue, ^{
    void (^completion)(void) = self->_backgroundCompletion;
    self->_backgroundCompletion = nil;
    if (completion) {
      dispatch_async(dispatch_get_main_queue(), completion);
    }
  });
}

#pragma mark - Status

- (NSDictionary *)statusFor:(NSDictionary *)entry
{
  NSMutableDictionary *status = [@{
    @"id" : entry[@"id"],
    @"bookId" : entry[@"bookId"] ?: @"",
    @"state" : entry[@"state"] ?: @"queued",
    @"bytesDownloaded" : entry[@"bytesDownloaded"] ?: @0,
  } mutableCopy];
  if (entry[@"totalBytes"]) status[@"totalBytes"] = entry[@"totalBytes"];
  if (entry[@"error"]) status[@"error"] = entry[@"error"];
  return status;
}

- (void)emitEntry:(NSDictionary *)entry
{
  if (_hasListeners) {
    [self sendEventWithName:Event body:[self statusFor:entry]];
  }
}

#pragma mark - Bridge

RCT_EXPORT_METHOD(start:(NSDictionary *)request
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(_queue, ^{
    NSString *identifier = request[@"id"];
    NSURL *url = [NSURL URLWithString:request[@"uri"]];
    if (!identifier || !url || ![url.scheme isEqualToString:@"https"]) {
      reject(@"download_start_failed", @"Downloads need an id and an HTTPS URL", nil);
      return;
    }
    self->_wifiOnly = [request[@"wifiOnly"] boolValue];
    NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:url];
    urlRequest.allowsCellularAccess = !self->_wifiOnly;
    NSURLSessionDownloadTask *task = [[self session] downloadTaskWithRequest:urlRequest];
    task.taskDescription = identifier;

    NSMutableDictionary *entry = [@{
      @"id" : identifier,
      @"bookId" : request[@"bookId"] ?: @"",
      @"title" : request[@"title"] ?: @"",
      @"uri" : request[@"uri"],
      @"state" : @"queued",
      @"bytesDownloaded" : @0,
    } mutableCopy];
    if (request[@"sizeBytes"]) entry[@"totalBytes"] = request[@"sizeBytes"];
    if (request[@"trustedSourceId"]) entry[@"trustedSourceId"] = request[@"trustedSourceId"];
    self->_index[identifier] = entry;
    [self saveIndex];
    [task resume];
    [self emitEntry:entry];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(remove:(NSString *)identifier
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[self session] getAllTasksWithCompletionHandler:^(NSArray<__kindof NSURLSessionTask *> *tasks) {
    for (NSURLSessionTask *task in tasks) {
      if ([task.taskDescription isEqualToString:identifier]) [task cancel];
    }
    dispatch_async(self->_queue, ^{
      NSDictionary *entry = self->_index[identifier];
      if (entry[@"file"]) {
        [[NSFileManager defaultManager]
            removeItemAtURL:[[self directory] URLByAppendingPathComponent:entry[@"file"]]
                      error:nil];
      }
      [self->_index removeObjectForKey:identifier];
      [self saveIndex];
      resolve(nil);
    });
  }];
}

RCT_EXPORT_METHOD(setWifiOnly:(BOOL)wifiOnly
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  // Applies to downloads started from now on; iOS can't change a running task.
  dispatch_async(_queue, ^{
    self->_wifiOnly = wifiOnly;
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(list:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(_queue, ^{
    NSMutableArray *statuses = [NSMutableArray array];
    for (NSDictionary *entry in self->_index.allValues) {
      [statuses addObject:[self statusFor:entry]];
    }
    resolve(statuses);
  });
}

RCT_EXPORT_METHOD(playbackSource:(NSString *)identifier
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(_queue, ^{
    NSDictionary *entry = self->_index[identifier];
    if (![entry[@"state"] isEqualToString:@"completed"] || !entry[@"file"]) {
      resolve([NSNull null]);
      return;
    }
    NSURL *file = [[self directory] URLByAppendingPathComponent:entry[@"file"]];
    resolve(@{@"kind": @"local", @"uri": file.absoluteString});
  });
}

RCT_EXPORT_METHOD(freeSpace:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSNumber *available = nil;
  [[self directory] getResourceValue:&available
                              forKey:NSURLVolumeAvailableCapacityForImportantUsageKey
                               error:nil];
  resolve(available ?: [NSNull null]);
}

#pragma mark - URLSession delegate

- (void)URLSession:(NSURLSession *)session
                 downloadTask:(NSURLSessionDownloadTask *)task
                 didWriteData:(int64_t)bytesWritten
            totalBytesWritten:(int64_t)totalBytesWritten
    totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  dispatch_async(_queue, ^{
    NSMutableDictionary *entry = self->_index[task.taskDescription];
    if (!entry) return;
    entry[@"state"] = @"downloading";
    entry[@"bytesDownloaded"] = @(totalBytesWritten);
    if (totalBytesExpectedToWrite > 0) entry[@"totalBytes"] = @(totalBytesExpectedToWrite);
    // About once a second, like Android.
    NSDate *now = [NSDate date];
    if (!self->_lastProgress || [now timeIntervalSinceDate:self->_lastProgress] >= 1) {
      self->_lastProgress = now;
      [self emitEntry:entry];
    }
  });
}

- (void)URLSession:(NSURLSession *)session
                 downloadTask:(NSURLSessionDownloadTask *)task
    didFinishDownloadingToURL:(NSURL *)location
{
  // The temporary file is deleted when this returns, so move it now.
  NSString *identifier = task.taskDescription;
  NSString *extension = task.originalRequest.URL.pathExtension.length
                            ? task.originalRequest.URL.pathExtension
                            : @"mp3";
  NSString *name = [NSString stringWithFormat:@"%@.%@", [[NSUUID UUID] UUIDString], extension];
  NSURL *destination = [[self directory] URLByAppendingPathComponent:name];
  NSError *error = nil;
  [[NSFileManager defaultManager] moveItemAtURL:location toURL:destination error:&error];
  [destination setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
  dispatch_sync(_queue, ^{
    NSMutableDictionary *entry = self->_index[identifier];
    if (!entry) {
      [[NSFileManager defaultManager] removeItemAtURL:destination error:nil];
      return;
    }
    if (error) {
      entry[@"state"] = @"failed";
      entry[@"error"] = @"download-failed";
    } else {
      entry[@"state"] = @"completed";
      entry[@"file"] = name;
      [entry removeObjectForKey:@"error"];
      if (entry[@"totalBytes"]) entry[@"bytesDownloaded"] = entry[@"totalBytes"];
    }
    [self saveIndex];
    [self emitEntry:entry];
  });
}

- (void)URLSession:(NSURLSession *)session
                    task:(NSURLSessionTask *)task
    didCompleteWithError:(NSError *)error
{
  if (!error) return;
  dispatch_async(_queue, ^{
    NSMutableDictionary *entry = self->_index[task.taskDescription];
    if (!entry || [entry[@"state"] isEqualToString:@"completed"]) return;
    BOOL waiting = error.code == NSURLErrorNotConnectedToInternet && self->_wifiOnly;
    entry[@"state"] = waiting ? @"paused" : @"failed";
    entry[@"error"] = waiting ? @"waiting-for-wifi" : @"download-failed";
    [self saveIndex];
    [self emitEntry:entry];
  });
}

@end
