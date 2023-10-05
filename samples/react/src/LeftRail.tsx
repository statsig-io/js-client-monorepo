import InboxIcon from '@mui/icons-material/Inbox';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import '@react-native-async-storage/async-storage';
import { ReactNode } from 'react';

const ITEMS = [
  ['/', 'Home'],
  ['/examples/multiple-clients', 'Multiple Clients'],
  [
    '/examples/precomputed-eval-performance',
    'Precomputed Evaluations Performance',
  ],
  ['/examples/on-device-eval-performance', 'On Device Evaluations Performance'],
  ['/examples/bundle-size', 'Bundle Size'],
];

export default function LeftRail(): ReactNode {
  return (
    <List>
      {ITEMS.map(([href, title]) => (
        <ListItem disablePadding>
          <ListItemButton onClick={() => (window.location.href = href)}>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
