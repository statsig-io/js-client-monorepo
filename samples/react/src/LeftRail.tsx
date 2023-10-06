import InboxIcon from '@mui/icons-material/Inbox';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { ReactNode } from 'react';

export default function LeftRail({
  routes,
}: {
  routes: {
    path: string;
    title: string;
  }[];
}): ReactNode {
  return (
    <Box display="flex" alignItems="center">
      <List>
        {routes.map(({ path, title }) => (
          <ListItem disablePadding key={`left-rail-${path}`}>
            <ListItemButton onClick={() => (window.location.href = path)}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary={title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
