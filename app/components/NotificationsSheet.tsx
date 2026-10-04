import React from 'react';

import {
  NOTIFICATION_LABELS,
  Notifications,
  useSettings,
} from '../state/settings';
import {Sheet, SheetRow} from '../ui';

type NotificationsSheetProps = {visible: boolean; onClose: () => void};

export const NotificationsSheet = ({
  visible,
  onClose,
}: NotificationsSheetProps) => {
  const settings = useSettings();
  return (
    <Sheet visible={visible} title="Notifications" onClose={onClose}>
      {(Object.keys(NOTIFICATION_LABELS) as Notifications[]).map(option => (
        <SheetRow
          key={option}
          label={NOTIFICATION_LABELS[option]}
          selected={settings.notifications === option}
          onPress={() => {
            settings.set('notifications', option);
            onClose();
          }}
        />
      ))}
    </Sheet>
  );
};
