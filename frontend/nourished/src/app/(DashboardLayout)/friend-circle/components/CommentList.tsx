import React from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Typography,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Comment } from "../page";
import DefaultAvatar from "../../components/shared/DefaultAvatar";

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "&:hover": {
    backgroundColor: theme.palette.background.default,
  },
}));

const StyledAvatar = styled(DefaultAvatar)(({ theme }) => ({
  width: 36,
  height: 36,
}));

const CommentContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

const CommentHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(0.5),
}));

const EmptyCommentsMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

interface CommentListProps {
  comments: Comment[];
  currentUserEmail: string;
  postOwnerEmail: string;
  onDeleteComment: (commentId: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserEmail,
  postOwnerEmail,
  onDeleteComment,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "undefined" || dateString === "null") {
      return "Just now";
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Recently";
      }

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recently";
    }
  };

  const canDeleteComment = (commentEmail: string) => {
    return (
      commentEmail === currentUserEmail || postOwnerEmail === currentUserEmail
    );
  };

  if (comments.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <EmptyCommentsMessage>
          <Typography variant="body1">
            No comments yet. Be the first to comment!
          </Typography>
        </EmptyCommentsMessage>
      </motion.div>
    );
  }

  return (
    <List sx={{ width: "100%", bgcolor: "background.paper", py: 0 }}>
      <AnimatePresence>
        {comments.map((comment, index) => (
          <React.Fragment key={comment.id || index}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StyledListItem alignItems="flex-start">
                <ListItemAvatar>
                  <StyledAvatar>
                    {comment.name?.charAt(0).toUpperCase() || "?"}
                  </StyledAvatar>
                </ListItemAvatar>

                <CommentContent>
                  <CommentHeader>
                    <Typography
                      variant="subtitle2"
                      component="span"
                      fontWeight={600}
                    >
                      {comment.name}
                    </Typography>

                    {canDeleteComment(comment.email) && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => onDeleteComment(comment.id)}
                        size="small"
                        sx={{ color: "error.main" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </CommentHeader>

                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {comment.comment}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {formatDate(comment.createdAt)}
                  </Typography>
                </CommentContent>
              </StyledListItem>

              {index < comments.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </motion.div>
          </React.Fragment>
        ))}
      </AnimatePresence>
    </List>
  );
};

export default CommentList;
