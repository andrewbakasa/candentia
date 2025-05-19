'use client';

import { toast } from "react-hot-toast";
import { useCallback, useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { SafeBoard, SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { useAction } from "@/hooks/use-action";
import Avatar from "@/app/components/Avatar";
import { activateBoard } from "@/actions/activate-board";
import { RotateCw } from "lucide-react";
import ConfirmAction from "../components/ConfirmAction";

interface ProjectsClientProps {
  boards: any[]; // SafeBoard2[],
  currentUser?: SafeUser | null;
}

const ProjectsClient: React.FC<ProjectsClientProps> = ({
  boards,
  currentUser
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBoards, setFilteredBoards] = useState(boards);

  useEffect(() => {
    if (searchTerm !== "") {
      const results = boards.filter((board) =>
        (
          board.title.toLowerCase().includes(searchTerm.toLowerCase())
          ||
          board.lists.some(
            (x_list: { title: string; cards: any[]; }) => (
              (
                x_list.title.toLowerCase().includes(searchTerm.toLowerCase())
                ||
                x_list.cards.some(
                  (x_card: { title: string; description: string; }) => (
                    x_card.title.toLowerCase().includes(searchTerm.toLowerCase())
                    ||
                    x_card.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
              )
            )
          )
        )
      );
      setFilteredBoards(results);
    } else {
      setFilteredBoards(boards);
    }
  }, [searchTerm, boards]);


  const handleDelteBOQ = async (id: string) => {
    try {
      console.log("id", id,);
      const response = await fetch(`/api/board-delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete board');
      }
      toast.success(`Deleted ${id}`);
      router.refresh();

    } catch (error: any) {
      console.log("---->", error);
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const { execute: executeActivate, isLoading } = useAction(activateBoard, {
    onSuccess: (data) => {
      toast.success(`Board restored`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleRestoreClick = (id: string) => {
    executeActivate({ id });
  };

  if (!currentUser?.isAdmin) return redirect('/denied');

  return (
    <Container>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <Heading
          title="Archived Projects"
          subtitle="Manage and restore your archived projects"
        />
        <Search
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
          //placeholder="Search archived projects..."
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center font-semibold text-lg text-neutral-700">
          <RotateCw className="h-6 w-6 mr-2" />
          Your Archived Projects
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBoards.map((board) => (
            <div
              key={board.id}
              className="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-200"
            >
              <div
                className="aspect-video bg-cover bg-center"
                style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
              >
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                  <button
                    onClick={() => handleRestoreClick(board.id)}
                    className="bg-white text-sky-700 p-2 rounded-md shadow-md hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 active:bg-sky-200"
                  >
                    <RotateCw className="h-5 w-5" />
                    <span className="sr-only">Restore</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="absolute top-2 right-2">
                  <Avatar classList="border-[1.5px] border-neutral-200 shadow-sm" src={board?.user_image}
                  // size="small"
                   />
                </div>
                <h3 className="font-semibold text-neutral-800 truncate">{board.title}</h3>
                <p className="text-sm text-neutral-500 truncate">{board.description || 'No description'}</p>
                <div className="absolute bottom-2 right-2">
                  <ConfirmAction
                    onConfirm={(id) => {
                      console.log(`Deleting item with ID: ${id}`);
                      handleDelteBOQ(id);
                    }}
                    itemId={board.id}
                    action="Delete"
                    heading={`Delete ${board.title}`}
                    description="Are you sure you want to permanently delete this project? This action cannot be undone."
                  
                  />
                </div>
              </div>
            </div>
          ))}
          {filteredBoards.length === 0 && (
            <div className="col-span-full text-center py-8 text-neutral-500">
              No archived projects found.
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ProjectsClient;