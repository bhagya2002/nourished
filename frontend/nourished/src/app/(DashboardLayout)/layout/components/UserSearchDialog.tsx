import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Fade,
  Box,
  ListSubheader,
  Card,
  Tooltip,
} from "@mui/material";
import {
  AccountCircle,
  KeyboardReturn,
  LockOutlined,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export type SearchedUser = {
  id: string;
  name: string;
  email: string;
  followers: string[];
  isPrivate?: boolean;
};

interface UserSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  open,
  onClose,
}) => {
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();
  const pathname = usePathname();

  const [recommendedUsers, setRecommendedUsers] = useState<SearchedUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchInputError, setIsSearchInputError] = useState(false);

  const handleCancel = () => {
    onClose();
  };

  const fetchRecommendedUsers = async () => {
    if (!user || !token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/getFriendRecommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          uid: user.uid,
        }),
      });
      const recommendedUsersData = await response.json();
      if (
        recommendedUsersData &&
        recommendedUsersData.data &&
        Array.isArray(recommendedUsersData.data)
      ) {
        setRecommendedUsers(recommendedUsersData.data);
      } else {
        setRecommendedUsers([]);
      }
    } catch (error) {
      console.error(error);
      setRecommendedUsers([]);
    }
  };

  const handleSearch = async () => {
    if (!user || !token) {
      return;
    }
    if (keyword.trim() === "") {
      setIsSearchInputError(true);
      return;
    }
    // implement search logic
    try {
      const response = await fetch(`${API_BASE_URL}/searchUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          data: {
            keyword: keyword,
          },
        }),
      });
      const searchResultsData = await response.json();
      if (
        searchResultsData &&
        searchResultsData.data &&
        Array.isArray(searchResultsData.data)
      ) {
        setSearchResults(searchResultsData.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    }
  };

  // Follows or unfollows user, type 0 for search results, 1 for recommended users
  const handleFollow = async (type: number, followee: string) => {
    try {
      if (!user || !token) {
        return;
      }

      // Find the user in the appropriate array
      const targetUser =
        type === 0
          ? searchResults.find((user) => user.id === followee)
          : recommendedUsers.find((user) => user.id === followee);

      // Check if user is private and not already followed
      if (targetUser?.isPrivate && !targetUser.followers?.includes(user.uid)) {
        // TODO: In the future, you could implement a follow request system here
        console.log("This account is private and cannot be followed");
        return;
      }

      let followOrUnfollow = "";
      if (type === 0) {
        followOrUnfollow = searchResults.find((theUser) =>
          theUser.followers?.includes(user.uid)
        )
          ? "unfollowUser"
          : "followUser";
      } else if (type === 1) {
        followOrUnfollow = recommendedUsers.find((theUser) =>
          theUser.followers?.includes(user.uid)
        )
          ? "unfollowUser"
          : "followUser";
      }

      const followRes = await fetch(`${API_BASE_URL}/${followOrUnfollow}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          followee,
        }),
      });

      const responseData = await followRes.json();

      if (!followRes.ok) {
        throw new Error("Failed to follow user");
      }
      // Update search results followers list, if user exists, remove it, if not, add it
      setSearchResults(
        searchResults.map((theUser) => {
          if (theUser.id !== followee) return theUser;
          if (theUser.followers?.includes(user.uid)) {
            theUser.followers = theUser.followers.filter(
              (followerId) => followerId !== user.uid
            );
            return theUser;
          }
          if (!theUser.followers) {
            theUser.followers = [user.uid];
          } else if (!theUser.followers.includes(user.uid)) {
            theUser.followers = [...theUser.followers, user.uid];
          }
          return theUser;
        })
      );
      // Update recommended users followers list, if user exists, remove it, if not, add it
      setRecommendedUsers(
        recommendedUsers.map((theUser) => {
          if (theUser.id !== followee) return theUser;
          if (theUser.followers?.includes(user.uid)) {
            theUser.followers = theUser.followers.filter(
              (followerId) => followerId !== user.uid
            );
            return theUser;
          }
          if (!theUser.followers) {
            theUser.followers = [user.uid];
          } else if (!theUser.followers.includes(user.uid)) {
            theUser.followers = [...theUser.followers, user.uid];
          }
          return theUser;
        })
      );
      if (pathname === "/profile") {
        location.reload();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  // Fetches recommended users while initializing the page
  useEffect(() => {
    if (user && token) {
      fetchRecommendedUsers();
    }
  }, [user, token]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Fade}
    >
      <DialogTitle>Search Friends</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <TextField
            error={isSearchInputError}
            helperText={
              isSearchInputError ? "Please enter name / email to search" : ""
            }
            sx={{ my: 1 }}
            label="Search by Name / Email"
            variant="outlined"
            fullWidth
            autoFocus
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setIsSearchInputError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button
            sx={{ my: 1, height: 52 }}
            variant="contained"
            startIcon={<KeyboardReturn />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
        {user && (
          <Card>
            <ListSubheader sx={{ fontWeight: "bold", userSelect: "none" }}>
              Search Results
            </ListSubheader>
            <Box sx={{ py: 1, px: 2 }}>
              {searchResults.length === 0 && (
                <Box
                  sx={{
                    py: 1,
                    px: 0,
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                  }}
                >
                  NOTHING...
                </Box>
              )}
              {searchResults.map((theUser: SearchedUser) => (
                <Box
                  key={theUser.id}
                  sx={{ display: "flex", alignItems: "center", py: 1 }}
                >
                  <Box sx={{ mr: 1 }}>
                    <AccountCircle />
                  </Box>
                  <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                    <Box
                      sx={{
                        fontWeight: "bold",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {theUser.name}
                      {theUser.isPrivate && (
                        <Tooltip title="Private Account">
                          <LockOutlined
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              fontSize: "1rem",
                              color: "text.secondary",
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Box
                      sx={{
                        color: "grey.500",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {theUser.email}
                    </Box>
                  </Box>
                  {theUser.id !== user.uid && (
                    <Box sx={{ ml: "1" }}>
                      {theUser.isPrivate &&
                      !theUser.followers?.includes(user.uid) ? (
                        <Tooltip title="This account is private and cannot be followed">
                          <span>
                            <Button variant="outlined" size="small" disabled>
                              Private
                            </Button>
                          </span>
                        </Tooltip>
                      ) : (
                        <Button
                          variant={
                            theUser.followers?.includes(user.uid)
                              ? "contained"
                              : "outlined"
                          }
                          size="small"
                          onClick={() => {
                            handleFollow(0, theUser.id);
                          }}
                        >
                          {theUser.followers?.includes(user.uid)
                            ? "Following"
                            : "Follow"}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
            <ListSubheader sx={{ fontWeight: "bold", userSelect: "none" }}>
              Recommended Users for You
            </ListSubheader>
            <Box sx={{ py: 1, px: 2 }}>
              {recommendedUsers.length === 0 && (
                <Box
                  sx={{
                    py: 1,
                    px: 0,
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                  }}
                >
                  NOTHING...
                </Box>
              )}
              {recommendedUsers.map((theUser: SearchedUser) => (
                <Box
                  key={theUser.id}
                  sx={{ display: "flex", alignItems: "center", py: 1 }}
                >
                  <Box sx={{ mr: 1 }}>
                    <AccountCircle />
                  </Box>
                  <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                    <Box
                      sx={{
                        fontWeight: "bold",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {theUser.name}
                      {theUser.isPrivate && (
                        <Tooltip title="Private Account">
                          <LockOutlined
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              fontSize: "1rem",
                              color: "text.secondary",
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Box
                      sx={{
                        color: "grey.500",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {theUser.email}
                    </Box>
                  </Box>
                  {theUser.id !== user.uid && (
                    <Box sx={{ ml: "1" }}>
                      {theUser.isPrivate &&
                      !theUser.followers?.includes(user.uid) ? (
                        <Tooltip title="This account is private and cannot be followed">
                          <span>
                            <Button variant="outlined" size="small" disabled>
                              Private
                            </Button>
                          </span>
                        </Tooltip>
                      ) : (
                        <Button
                          variant={
                            theUser.followers?.includes(user.uid)
                              ? "contained"
                              : "outlined"
                          }
                          size="small"
                          onClick={() => {
                            handleFollow(1, theUser.id);
                          }}
                        >
                          {theUser.followers?.includes(user.uid)
                            ? "Following"
                            : "Follow"}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Card>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSearchDialog;
