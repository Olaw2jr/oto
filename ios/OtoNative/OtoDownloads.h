#import <React/RCTEventEmitter.h>

// Background downloads for offline listening (D3). Posted by the app
// delegate with the system's completion handler when iOS wakes oto to
// finish background downloads.
extern NSString *const OtoDownloadsBackgroundEvents;

@interface OtoDownloads : RCTEventEmitter <NSURLSessionDownloadDelegate>
@end
