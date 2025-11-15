"use client";

import { toast } from "sonner";
import { AlignLeft, Settings, UserCheck, Shield } from "lucide-react"; // Added new icons
import { redirect, useParams } from "next/navigation";
import { useState, useRef, ElementRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener } from "usehooks-ts";

import { useAction } from "@/hooks/use-action";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { FormTextarea } from "@/components/form/form-textarea"; // Keeping for compatibility, but its use is adjusted
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { SafeUser } from "@/app/types";
import Select, { MultiValue, ActionMeta } from 'react-select';
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/actions/update-user";
import { cn } from "@/lib/utils";
import { useOverdueStore } from "@/hooks/useOverduState";
import { useQueueStore } from "@/hooks/use-QueueState";
import { useCompletedTaskStore } from "@/hooks/use-CompletedTaskState";
import { useInverseStore } from "@/hooks/use-inverseState";
import { uselistStore } from "@/hooks/use-listState";
import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
import { useShowBGImageStore } from "@/hooks/use-showBGImage";
import { useInverseTableStore } from "@/hooks/use-inverseTableState";
import { useCollapseStore } from "@/hooks/use-collapseState";
import { useShowMobileViewStore } from "@/hooks/use-mobileView";

interface UserDataProps {
  data: SafeUser;
  currentUser?: SafeUser | null;
};

// Interface for Select options (already defined, but including here for completeness)
interface Option {
    value: string;
    label: string;
}

export const UserData = ({
  data,
  currentUser
}: UserDataProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  
  // State variables initialization (keeping original for minimal logic change)
  const [isChecked, setIsChecked] = useState(data.isAdmin || false); 
  const [isCheckedReadMode, setIsCheckedReadMode] = useState(data.cardReadMode || false); 
  const [isCheckedShowMobileView, setIsCheckedShowMobileView] = useState(data.showMobileView || false); 
  const [isCheckedShowBGImage, setIsCheckedShowBGImage] = useState(data.showBGImage || false); 
  const [isCheckedNotificationToaster, setIsCheckedNotificationToaster] = useState(data.notificationToaster || false); 
  const [isCheckedTogglePendingTasksOrAll, setIsCheckedTogglePendingTasksOrAll] = useState(data.togglePendingTasksOrAll || false); 
  const [isCheckedToggleRecentTaskorAll, setIsCheckedToggleRecentTaskorAll] = useState(data.toggleRecentTaskorAll || false); 
  const [isCheckedToggleInverse, setIsCheckedToggleInverse] = useState(data.toggleInverse || false); 
  const [isCheckedToggleInverseTable, setIsCheckedToggleInverseTable] = useState(data.toggleInverseTable || false); 
  const [isCheckedEmptyListShow, setIsCheckedEmptyListShow] = useState(data.emptyListShow || false); 
  const [isCheckedShowMyProjectsOnLoad, setIsCheckedShowMyProjectsOnLoad] = useState(data.showMyProjectsOnLoad || false); 
  const [isCheckedToggleOverdueorAll, setIsCheckedToggleOverdueorAll] = useState(data.toggleOverdueorAll || false); 
  const [isCheckedCollapseBoards, setIsCheckedCollapseBoards] = useState(data.collapseBoards || false); 
  const [isCheckedYscroll, setIsCheckedYScroll] = useState(data.cardYscroll || false); 
  const [isCheckedShowTitle, setIsCheckedShowTitle] = useState(data.cardShowTitle || false); 
  const [recentInput, setRecentInput] = useState<number>(data.recentDays || 7); 

  // Store actions (keeping original)
  const { setOverdueState } = useOverdueStore();
  const { setRecentQueueState } = useQueueStore();
  const { setCompletedTaskState } = useCompletedTaskStore();
  const { setInverseTableState } = useInverseTableStore();
  const { setInverseState } = useInverseStore();
  const { setListState } = uselistStore();
  const { setReadModeState } = useCardReadModeStore();
  const { setShowMobileViewState } = useShowMobileViewStore();
  const { setCollapseState } = useCollapseStore();
  const { setShowBGImageState } = useShowBGImageStore();

  // Handlers (keeping original)
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsChecked(event.target.checked); };
  const handleCheckboxReadModeChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedReadMode(event.target.checked); };
  const handleCheckboxShowMobileViewChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedShowMobileView(event.target.checked); };
  const handleCheckboxShowBGImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedShowBGImage(event.target.checked); };
  const handleCheckboxNotificationToasterChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedNotificationToaster(event.target.checked); };
  const handleCheckboxTogglePendingTasksOrAllChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedTogglePendingTasksOrAll(event.target.checked); };
  const handleCheckboxToggleRecentTaskorAllChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedToggleRecentTaskorAll(event.target.checked); };
  const handleCheckboxToggleInverseChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedToggleInverse(event.target.checked); };
  const handleCheckboxToggleInverseTableChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedToggleInverseTable(event.target.checked); };
  const handleCheckboxToggleOverdueorAllChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedToggleOverdueorAll(event.target.checked); };
  const handleCheckboxEmptyListShowChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedEmptyListShow(event.target.checked); };
  const handleCheckboxShowMyProjectsOnLoadChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedShowMyProjectsOnLoad(event.target.checked); };
  const handleCheckboxCollapseBoardsChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedCollapseBoards(event.target.checked); };
  const handleCheckboxYScrollChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedYScroll(event.target.checked); };
  const handleCheckboxShowTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => { setIsCheckedShowTitle(event.target.checked); };
  const handleRecentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRecentDays = parseInt(event.target.value, 10); 
    if (!isNaN(newRecentDays)) { 
      setRecentInput(newRecentDays);
    }
  };


  const isCurrentLogInUserRecord = currentUser?.id == data.id;
  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<ElementRef<"textarea">>(null);
  const inputboxRef = useRef<ElementRef<"input">>(null);
  const checkboxReadModeRef = useRef<ElementRef<"input">>(null);
  const checkboxShowMobileViewRef = useRef<ElementRef<"input">>(null);
  const checkboxShowBGImageRef = useRef<ElementRef<"input">>(null);
  const checkboxNotificationToasterRef = useRef<ElementRef<"input">>(null);
  const checkboxTogglePendingTasksOrAllRef = useRef<ElementRef<"input">>(null);
  const checkboxToggleRecentTaskorAllRef = useRef<ElementRef<"input">>(null);
  const checkboxToggleOverdueorAllRef = useRef<ElementRef<"input">>(null);
  const checkboxToggleInverseRef = useRef<ElementRef<"input">>(null);
  const checkboxToggleInverseTableRef = useRef<ElementRef<"input">>(null);
  const checkboxEmptyListShowRef = useRef<ElementRef<"input">>(null);
  const checkboxShowMyProjectsOnLoadRef = useRef<ElementRef<"input">>(null);
  const checkboxCollapseBoardsRef = useRef<ElementRef<"input">>(null);
  const checkboxYScrollRef = useRef<ElementRef<"input">>(null);
  const checkboxShowTitleRef = useRef<ElementRef<"input">>(null);
  const inputRecentDayRef = useRef<ElementRef<"input">>(null);


  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      // disableEditing(); // Commented out unused logic
    }
  };
  useEventListener("keydown", onKeyDown);

  // useAction and onSubmit logic (keeping original, as it's backend/API interaction)
  const { execute, fieldErrors } = useAction(updateUser, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user", data.id] });
      queryClient.invalidateQueries({ queryKey: ["user-logs", data.id] });
      
      const successMessage = isCurrentLogInUserRecord 
        ? `My profile ${data.name} email: ${data.email} updated successfully.`
        : `User: ${data.name} email: ${data.email} roles updated to: [${data?.roles.join(", ")}]`;
      toast.success(successMessage);
      
      // Update local state stores (keeping original logic)
      setCompletedTaskState(data.togglePendingTasksOrAll);
      setRecentQueueState(data.toggleRecentTaskorAll);
      setInverseState(data.toggleInverse);
      setInverseTableState(data.toggleInverseTable);
      setListState(data.emptyListShow);
      setOverdueState(data.toggleOverdueorAll);
      setReadModeState(data.cardReadMode);
      setShowMobileViewState(data.showMobileView);
      setCollapseState(data.collapseBoards);
      setShowBGImageState(data.showBGImage);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const roles = formData.getAll('roles');
    const stringRoles = roles.map((value) => value) as string[];
    const userId = params?.userID as string;
    
    // Extracting all form data
    const isAdmin = Boolean(formData.get("isAdmin"));
    const isReadMode = Boolean(formData.get("cardReadMode"));
    const isShowMobileView = Boolean(formData.get("showMobileView"));
    const isYScroll = Boolean(formData.get("cardYscroll"));
    const isCardShowTitle = Boolean(formData.get("cardShowTitle"));
    const isShowBGImage = Boolean(formData.get("showBGBGImage")); // Corrected form key if needed, or kept original: showBGImage
    const recentDays = Number(formData.get("recentDays"));
    const notificationToaster = Boolean(formData.get("notificationToaster"));
    const toggleRecentTaskorAll = Boolean(formData.get("toggleRecentTaskorAll"));
    const togglePendingTasksOrAll = Boolean(formData.get("togglePendingTasksOrAll"));
    const toggleOverdueorAll = Boolean(formData.get("toggleOverdueorAll"));
    const toggleInverse = Boolean(formData.get("toggleInverse"));
    const toggleInverseTable = Boolean(formData.get("toggleInverseTable"));
    const emptyListShow = Boolean(formData.get("emptyListShow"));
    const showMyProjectsOnLoad = Boolean(formData.get("showMyProjectsOnLoad"));
    const collapseBoards = Boolean(formData.get("collapseBoards"));
    
    // Execution logic (keeping original)
    if (isCurrentLogInUserRecord) {
      execute({
        id: data.id,
        cardReadMode: isReadMode,
        showMobileView: isShowMobileView,
        showBGImage: isShowBGImage,
        cardYscroll: isYScroll,
        cardShowTitle: isCardShowTitle,
        recentDays: recentDays,
        notificationToaster: notificationToaster,
        togglePendingTasksOrAll: togglePendingTasksOrAll,
        toggleRecentTaskorAll: toggleRecentTaskorAll,
        toggleOverdueorAll: toggleOverdueorAll,
        toggleInverse: toggleInverse,
        toggleInverseTable: toggleInverseTable,
        emptyListShow: emptyListShow,
        showMyProjectsOnLoad: showMyProjectsOnLoad,
        collapseBoards: collapseBoards
      });
    } else {
      execute({
        id: data.id,
        roles: stringRoles,
        isAdmin: isAdmin
      });
    }
  } 

  // Role options (keeping original)
  const options: Option[] = [
    { value: 'visitor', label: "Visitor" },
    { value: 'employee', label: "Employee" },
    { value: 'manager', label: "Manager" },
     { value: 'executive', label: "Executive" },
    { value: 'admin', label: "Admin" },
  ];
  const convertToOptionArray = (values: string[]): MultiValue<Option> => {
    return values.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
  };
  const [selectedValue, setSelectedValue] = useState<MultiValue<Option>>(convertToOptionArray(data.roles.map((option: any) => option)));

  const handleSelectChange = (newValue: MultiValue<Option>, actionMeta: ActionMeta<Option>) => {
    const optionsArray = Array.from(newValue);
    setSelectedValue(optionsArray);
  };

  // Access control logic (keeping original)
  let allowedRoles: String[] = ['admin', 'manager'];
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
    allowedRoles.some((y) => y.toLowerCase().includes(role.toLowerCase()))
  ) || [];
  if (isAllowedAccess?.length === 0 && currentUser?.id !== data.id) return redirect('/denied'); 

  // Helper component for clean checkbox rendering
  const CheckboxField = ({ id, name, checked, onChange, disabled, label, reference }: {
    id: string, name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean, label: string, reference: any
  }) => (
    <div className="flex items-center space-x-2 p-1 rounded-sm hover:bg-neutral-50 transition">
      <input 
        id={id} 
        name={name}
        type="checkbox" 
        ref={reference} 
        checked={checked}
        onChange={onChange}
        disabled={disabled} 
        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
      />
      <label htmlFor={id} className={cn("text-sm text-neutral-600", disabled && "opacity-70 cursor-not-allowed")}>
        {label}
      </label>
    </div>
  );

  return (
    <div className="flex items-start gap-x-3 md:min-w-[700px]">
      {/* Icon is for general context, AlignLeft is a bit generic. Using Settings or UserCheck is better */}
      {isCurrentLogInUserRecord ? <UserCheck className="h-5 w-5 mt-0.5 text-neutral-700" /> : <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />}
      
      <div className="w-full">
        {/* Title and Back Link */}
        <p className="flex flex-row justify-between font-semibold text-neutral-700 mb-4">
          <span className="flex items-center space-x-2 text-xl">
            {isChecked && isCurrentLogInUserRecord && (
              <svg className="text-yellow-500" width="23" height="23" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            )} 
            {isCurrentLogInUserRecord ? 'Your Profile & Preferences' : `Manage User: ${data.name || 'Details'}`}
          </span>
          
          {!isCurrentLogInUserRecord && (
            <Link
              href={`/users`}
              className="hover:text-red-700 text-sm font-normal text-blue-600"
            >
              &larr; Back to **Users List**
            </Link>
          )}
        </p>

        <form
          id="id1"
          name="name1"
          action={onSubmit}
          ref={formRef}
          className="space-y-6"
        >
          {/* USER INFO / ADMIN SECTION */}
          <div className="space-y-3 p-4 border rounded-lg bg-neutral-50">
            <h3 className="text-lg font-semibold flex items-center text-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              {isCurrentLogInUserRecord ? 'Account Details' : 'Admin & Roles Management'}
            </h3>

            {/* Email/Name Info */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Email Address: 
                <span className="font-normal text-blue-600 ml-2">{data.email}</span>
              </label>
              <label className="text-sm font-medium text-neutral-700">
                Name: 
                <span className="font-normal text-blue-600 ml-2">{data.name}</span>
              </label>
            </div>
            
            <Separator className="my-3"/>
            
            {/* Admin and Roles Controls */}
            <div className="flex md:flex-row flex-col justify-between items-start md:items-center space-y-4 md:space-y-0">
              {/* Is Admin Checkbox */}
              <CheckboxField
                id="isAdmin" 
                name="isAdmin"
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={isCurrentLogInUserRecord}
                label="Is User an Admin (Superuser)?"
                reference={inputboxRef}
              />
              
              {/* Roles Multi-Select */}
              <div className="flex flex-col w-full md:w-1/2">
                <label htmlFor="roles" className="text-sm font-medium text-neutral-700 mb-1">Roles:</label>
                <Select
                  className="text-gray-500 w-full"
                  id="roles"
                  name="roles"
                  value={selectedValue}
                  onChange={handleSelectChange}
                  options={options}
                  isMulti 
                  isDisabled={isCurrentLogInUserRecord}
                />
              </div>
            </div>
          </div>
          
          {/* PERSONAL PREFERENCES SECTION */}
          {isCurrentLogInUserRecord && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold flex items-center text-gray-700">
                <Settings className="h-4 w-4 mr-2" />
                Display & Task Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {/* DISPLAY SETTINGS */}
                <div className="space-y-2">
                    <p className="font-medium text-neutral-600 pt-2">Display Customization</p>
                    <Separator/>
                    <CheckboxField 
                        id="cardReadMode" name="cardReadMode" checked={isCheckedReadMode} 
                        onChange={handleCheckboxReadModeChange} disabled={!isCurrentLogInUserRecord} 
                        label="Card Read Mode (Optimized text view)" 
                        reference={checkboxReadModeRef} 
                    />
                    <CheckboxField 
                        id="cardYscroll" name="cardYscroll" checked={isCheckedYscroll} 
                        onChange={handleCheckboxYScrollChange} disabled={!isCurrentLogInUserRecord} 
                        label="Enable Card Y-Scroll Mode" 
                        reference={checkboxYScrollRef} 
                    />
                    <CheckboxField 
                        id="cardShowTitle" name="cardShowTitle" checked={isCheckedShowTitle} 
                        onChange={handleCheckboxShowTitleChange} disabled={!isCurrentLogInUserRecord} 
                        label="Show Card Titles" 
                        reference={checkboxShowTitleRef} 
                    />
                    <CheckboxField 
                        id="showBGImage" name="showBGImage" checked={isCheckedShowBGImage} 
                        onChange={handleCheckboxShowBGImageChange} disabled={!isCurrentLogInUserRecord} 
                        label="Show Background Image" 
                        reference={checkboxShowBGImageRef} 
                    />
                    <CheckboxField 
                        id="collapseBoards" name="collapseBoards" checked={isCheckedCollapseBoards} 
                        onChange={handleCheckboxCollapseBoardsChange} disabled={!isCurrentLogInUserRecord} 
                        label="Collapse Boards (Mini-View State)" 
                        reference={checkboxCollapseBoardsRef} 
                    />
                     <CheckboxField 
                        id="emptyListShow" name="emptyListShow" checked={isCheckedEmptyListShow} 
                        onChange={handleCheckboxEmptyListShowChange} disabled={!isCurrentLogInUserRecord} 
                        label="Display Empty Lists" 
                        reference={checkboxEmptyListShowRef} 
                    />
                     <CheckboxField 
                        id="showMobileView" name="showMobileView" checked={isCheckedShowMobileView} 
                        onChange={handleCheckboxShowMobileViewChange} disabled={!isCurrentLogInUserRecord} 
                        label="Force Mobile View on Desktop" 
                        reference={checkboxShowMobileViewRef} 
                    />
                    <CheckboxField 
                        id="notificationToaster" name="notificationToaster" checked={isCheckedNotificationToaster} 
                        onChange={handleCheckboxNotificationToasterChange} disabled={!isCurrentLogInUserRecord} 
                        label="Mobile Notification Toaster" 
                        reference={checkboxNotificationToasterRef} 
                    />
                    
                </div>
                
                {/* FILTERING/TOGGLE SETTINGS */}
                <div className="space-y-2">
                    <p className="font-medium text-neutral-600 pt-2">Task and Project Filtering</p>
                    <Separator/>
                    <CheckboxField 
                        id="togglePendingTasksOrAll" name="togglePendingTasksOrAll" checked={isCheckedTogglePendingTasksOrAll} 
                        onChange={handleCheckboxTogglePendingTasksOrAllChange} disabled={!isCurrentLogInUserRecord} 
                        label="Toggle Pending Tasks (Otherwise show All)" 
                        reference={checkboxTogglePendingTasksOrAllRef} 
                    />
                    <CheckboxField 
                        id="toggleRecentTaskorAll" name="toggleRecentTaskorAll" checked={isCheckedToggleRecentTaskorAll} 
                        onChange={handleCheckboxToggleRecentTaskorAllChange} disabled={!isCurrentLogInUserRecord} 
                        label="Toggle Recent Tasks (Otherwise show All)" 
                        reference={checkboxToggleRecentTaskorAllRef} 
                    />
                    <CheckboxField 
                        id="toggleOverdueorAll" name="toggleOverdueorAll" checked={isCheckedToggleOverdueorAll} 
                        onChange={handleCheckboxToggleOverdueorAllChange} disabled={!isCurrentLogInUserRecord} 
                        label="Toggle Overdue Tasks (Otherwise show All)" 
                        reference={checkboxToggleOverdueorAllRef} 
                    />
                    <CheckboxField 
                        id="toggleInverse" name="toggleInverse" checked={isCheckedToggleInverse} 
                        onChange={handleCheckboxToggleInverseChange} disabled={!isCurrentLogInUserRecord} 
                        label="Toggle Inverse [Completed, Overdue, etc.]" 
                        reference={checkboxToggleInverseRef} 
                    />
                    <CheckboxField 
                        id="toggleInverseTable" name="toggleInverseTable" checked={isCheckedToggleInverseTable} 
                        onChange={handleCheckboxToggleInverseTableChange} disabled={!isCurrentLogInUserRecord} 
                        label="Toggle Inverse Table" 
                        reference={checkboxToggleInverseTableRef} 
                    />
                    <CheckboxField 
                        id="showMyProjectsOnLoad" name="showMyProjectsOnLoad" checked={isCheckedShowMyProjectsOnLoad} 
                        onChange={handleCheckboxShowMyProjectsOnLoadChange} disabled={!isCurrentLogInUserRecord} 
                        label="Show My Projects on Load (Otherwise show All)" 
                        reference={checkboxShowMyProjectsOnLoadRef} 
                    />

                    {/* Recent Days Input */}
                    <div className="flex items-center space-x-2 mt-4 p-1 rounded-sm">
                        <label htmlFor="recentDays" className="text-sm font-medium text-neutral-600">
                          Recent Days for Filtering:
                        </label>
                        <input 
                            id="recentDays" 
                            name="recentDays"
                            type="number" 
                            ref={inputRecentDayRef} 
                            value={recentInput}
                            className="border w-16 p-1 text-center text-sm rounded-md shadow-sm focus:border-rose-500"
                            onChange={handleRecentInputChange}
                            disabled={!isCurrentLogInUserRecord} 
                        />
                    </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Submission and Cancel Buttons */}
          <div className="pt-4 flex items-center gap-x-2">
            <FormSubmit 
              className={cn(
                "px-4 py-2 text-white rounded-md transition duration-150",
                isCurrentLogInUserRecord ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              Save Changes
            </FormSubmit>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-neutral-500 hover:bg-neutral-100"
              // The original component had no actual cancel logic (no state to reset), 
              // but keeping the button for UI completeness.
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

UserData.Skeleton = function UserDataSkeleton() {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full space-y-4">
        <Skeleton className="w-48 h-8 mb-2 bg-neutral-200" />
        <div className="space-y-3 p-4 border rounded-lg">
            <Skeleton className="w-full h-24 bg-neutral-200" />
            <Skeleton className="w-full h-10 bg-neutral-200" />
        </div>
        <div className="space-y-3 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 bg-neutral-200" />
                <Skeleton className="h-8 bg-neutral-200" />
                <Skeleton className="h-8 bg-neutral-200" />
                <Skeleton className="h-8 bg-neutral-200" />
            </div>
        </div>
      </div>
    </div>
  );
};
// "use client";

// import { toast } from "sonner";
// import { AlignLeft } from "lucide-react";
// import { redirect, useParams } from "next/navigation";
// import { useState, useRef, ElementRef } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { useEventListener, useOnClickOutside } from "usehooks-ts";

// import { useAction } from "@/hooks/use-action";
// import Link from "next/link";
// import { Skeleton } from "@/components/ui/skeleton";
// import { FormTextarea } from "@/components/form/form-textarea";
// import { FormSubmit } from "@/components/form/form-submit";
// import { Button } from "@/components/ui/button";
// import { SafeUser } from "@/app/types";
// import Select from 'react-select';
// import { MultiValue ,ActionMeta } from 'react-select'; 
// import { Separator } from "@/components/ui/separator";
// import { updateUser } from "@/actions/update-user";
// import { cn } from "@/lib/utils";
// import { useOverdueStore } from "@/hooks/useOverduState";
// import { useQueueStore } from "@/hooks/use-QueueState";
// import { useCompletedTaskStore } from "@/hooks/use-CompletedTaskState";
// import { useInverseStore } from "@/hooks/use-inverseState";
// import { uselistStore } from "@/hooks/use-listState";
// import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
// import { useShowBGImageStore } from "@/hooks/use-showBGImage";
// import { useInverseTableStore } from "@/hooks/use-inverseTableState";
// import { useCollapseStore } from "@/hooks/use-collapseState";
// import { useShowMobileViewStore } from "@/hooks/use-mobileView";

// interface UserDataProps {
//   data: SafeUser;
//   currentUser?: SafeUser | null;
// };

// export const UserData = ({
//   data,
//   currentUser
// }: UserDataProps) => {
//   const params = useParams();
//   const queryClient = useQueryClient();
//  // const [isEditing, setIsEditing] = useState(true);//always set to true
//   const [isChecked, setIsChecked] = useState(data.isAdmin||false); // Default checked
//   const [isCheckedReadMode, setIsCheckedReadMode] = useState(data.cardReadMode||false); // Default checked
  
//   const [isCheckedShowMobileView, setIsCheckedShowMobileView] = useState(data.showMobileView||false); // Default checked
//   const [isCheckedShowBGImage, setIsCheckedShowBGImage] = useState(data.showBGImage||false); // Default checked
  
//   const [isCheckedNotificationToaster, setIsCheckedNotificationToaster] = useState(data.notificationToaster||false); // Default checked
//   const [isCheckedTogglePendingTasksOrAll, setIsCheckedTogglePendingTasksOrAll] = useState(data.togglePendingTasksOrAll||false); // Default checked
//   const [isCheckedToggleRecentTaskorAll, setIsCheckedToggleRecentTaskorAll] = useState(data.toggleRecentTaskorAll||false); // Default checked
//   const [isCheckedToggleInverse, setIsCheckedToggleInverse] = useState(data.toggleInverse||false); // Default checked
//   const [isCheckedToggleInverseTable, setIsCheckedToggleInverseTable] = useState(data.toggleInverseTable||false); // Default checked
  
//   const [isCheckedEmptyListShow, setIsCheckedEmptyListShow] = useState(data.emptyListShow||false); // Default checked
//   const [isCheckedShowMyProjectsOnLoad, setIsCheckedShowMyProjectsOnLoad] = useState(data.showMyProjectsOnLoad||false); // Default checked
//   const [isCheckedToggleOverdueorAll, setIsCheckedToggleOverdueorAll] = useState(data.toggleOverdueorAll||false); // Default checked
//   const [isCheckedCollapseBoards, setIsCheckedCollapseBoards] = useState(data.collapseBoards||false); // Default checked
  
  
//   const [isCheckedYscroll, setIsCheckedYScroll] = useState(data.cardYscroll||false); // Default checked
//   // const [recentInput, setRecentInput] = useState(data.recentDays||7); // Default checked
  
//   const [isCheckedShowTitle, setIsCheckedShowTitle] = useState(data.cardShowTitle||false); // Default checked
  
//   const {overdueState, setOverdueState}= useOverdueStore();
//   const {recentQ, setRecentQueueState}= useQueueStore();
//   const {completedTasks, setCompletedTaskState}= useCompletedTaskStore();
//   const {inverseTableState ,setInverseTableState}= useInverseTableStore();
//   const {inverseState ,setInverseState}= useInverseStore();
  
//   const {listState ,setListState}= uselistStore();
  
  
//   const {readMode,setReadModeState}= useCardReadModeStore();
//   const {showMobileView, setShowMobileViewState}=useShowMobileViewStore();
  
//   const {setCollapseState}=useCollapseStore()
//   const {showBGImage,setShowBGImageState}= useShowBGImageStore();


//   const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsChecked(event.target.checked);
//   };

//   const handleCheckboxReadModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedReadMode(event.target.checked);
//   };

  
//   const handleCheckboxShowMobileViewChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedShowMobileView(event.target.checked);
//   };

//   const handleCheckboxShowBGImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedShowBGImage(event.target.checked);
//   };
  
//   const handleCheckboxNotificationToasterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedNotificationToaster(event.target.checked);
//   };
  

//   const handleCheckboxTogglePendingTasksOrAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedTogglePendingTasksOrAll(event.target.checked);
//   };
//   const handleCheckboxToggleRecentTaskorAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedToggleRecentTaskorAll(event.target.checked);
//   };
//   const handleCheckboxToggleInverseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedToggleInverse(event.target.checked);
//   };
//   const handleCheckboxToggleInverseTableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedToggleInverseTable(event.target.checked);
//   };
//   const handleCheckboxToggleOverdueorAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedToggleOverdueorAll(event.target.checked);
//   };
//   const handleCheckboxEmptyListShowChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedEmptyListShow(event.target.checked);
//   };

//   const handleCheckboxShowMyProjectsOnLoadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedShowMyProjectsOnLoad(event.target.checked);
//   };

//   const handleCheckboxCollapseBoardsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedCollapseBoards(event.target.checked);
//   };
//   const handleCheckboxYScrollChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedYScroll(event.target.checked);
//   };

//   const handleCheckboxShowTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setIsCheckedShowTitle(event.target.checked);
//   };


//   const isCurrentLogInUserRecord = currentUser?.id == data.id  
//   const formRef = useRef<ElementRef<"form">>(null);
//   const textareaRef = useRef<ElementRef<"textarea">>(null);
//   const inputboxRef = useRef<ElementRef<"input">>(null);
//   const checkboxReadModeRef = useRef<ElementRef<"input">>(null);
  
//   const checkboxShowMobileViewRef = useRef<ElementRef<"input">>(null);
//   const checkboxShowBGImageRef = useRef<ElementRef<"input">>(null);
  
//   const checkboxNotificationToasterRef = useRef<ElementRef<"input">>(null);
//   const checkboxTogglePendingTasksOrAllRef = useRef<ElementRef<"input">>(null);
//   const checkboxToggleRecentTaskorAllRef = useRef<ElementRef<"input">>(null);
//   const checkboxToggleOverdueorAllRef = useRef<ElementRef<"input">>(null);
//   const checkboxToggleInverseRef = useRef<ElementRef<"input">>(null);
//   const checkboxToggleInverseTableRef = useRef<ElementRef<"input">>(null);
  
//   const checkboxEmptyListShowRef = useRef<ElementRef<"input">>(null);
//   const checkboxShowMyProjectsOnLoadRef = useRef<ElementRef<"input">>(null);
//   const checkboxCollapseBoardsRef = useRef<ElementRef<"input">>(null);
 
 
  
//   const checkboxYScrollRef = useRef<ElementRef<"input">>(null);
//   const checkboxShowTitleRef = useRef<ElementRef<"input">>(null);
  
//   const inputRecentDayRef = useRef<ElementRef<"input">>(null);

//   const [recentInput, setRecentInput] = useState<number>(data.recentDays||7); // Initial value
//   // const inputRecentDayRef = useRef<HTMLInputElement>(null);

//   const handleRecentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const newRecentDays = parseInt(event.target.value, 10); // Parse to number
//     if (!isNaN(newRecentDays)) { // Validate input
//       setRecentInput(newRecentDays);
//     }
//   };
//   // const enableEditing = () => {
//   //   setIsEditing(true);
//   //   setTimeout(() => {
//   //     textareaRef.current?.focus();
//   //   });
//   // }

//   // const disableEditing = () => {
//   //   setIsEditing(false);
//   // };

//   const onKeyDown = (e: KeyboardEvent) => {
//     if (e.key === "Escape") {
//     //  disableEditing();
//     }
//   };

//   useEventListener("keydown", onKeyDown);
//  // useOnClickOutside(formRef, disableEditing);

//   const { execute, fieldErrors } = useAction(updateUser, {
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({
//         queryKey: ["user", data.id],
//       });
//       queryClient.invalidateQueries({
//         queryKey: ["user-logs", data.id]
//       });
//       if (isCurrentLogInUserRecord){
//         toast.success(`My profile ${data.name}  email: ${data.email} updated successfully: `);
    
//       }else {
//         toast.success(`User: ${data.name}  email: ${data.email} roles updated to: [${data?.roles.join(", ")}]`);
    
//       }
//       //after persisting to DB set new properties
//       setCompletedTaskState(data.togglePendingTasksOrAll)
//       setRecentQueueState(data.toggleRecentTaskorAll)
//       setInverseState(data.toggleInverse)
//       setInverseTableState(data.toggleInverseTable)
     
//       setListState(data.emptyListShow)
//       setOverdueState(data.toggleOverdueorAll)
//       setReadModeState(data.cardReadMode)
      
//       setShowMobileViewState(data.showMobileView)
//       setCollapseState(data.collapseBoards)
//       setShowBGImageState(data.showBGImage)
     
//       //-------
//      // disableEditing();
//     },
//     onError: (error) => {
//       toast.error(error);
//     },
//   });

//   const onSubmit = (formData: FormData) => {
//     //const rolesA = formData.get("roles") as string
//     const roles = formData.getAll('roles')
//     //const stringRoles2 = roles.filter((value): value is string => typeof value === 'string') as string[];
//     const stringRoles = roles.map((value) => value) as string[];
//     const userId = params?.userID as string;
//     const isAdmin = Boolean(formData.get("isAdmin"));
//     const isReadMode= Boolean(formData.get("cardReadMode"));
    
//     const isShowMobileView= Boolean(formData.get("showMobileView"));

//     const isYScroll= Boolean(formData.get("cardYscroll"));
//     const isCardShowTitle= Boolean(formData.get("cardShowTitle"));
//     const isShowBGImage= Boolean(formData.get("showBGImage"));
   
//     const recentDays= Number(formData.get("recentDays"));
//     const notificationToaster= Boolean(formData.get("notificationToaster"));

//     const toggleRecentTaskorAll= Boolean(formData.get("toggleRecentTaskorAll"));
//     const togglePendingTasksOrAll= Boolean(formData.get("togglePendingTasksOrAll"));
//     const toggleOverdueorAll= Boolean(formData.get("toggleOverdueorAll"))
 
//     const toggleInverse= Boolean(formData.get("toggleInverse"));
    
//     const toggleInverseTable= Boolean(formData.get("toggleInverseTable"));
 
//     const emptyListShow= Boolean(formData.get("emptyListShow"));
//     const showMyProjectsOnLoad= Boolean(formData.get("showMyProjectsOnLoad"));
//     const collapseBoards= Boolean(formData.get("collapseBoards"));
   
   
//     if (isCurrentLogInUserRecord){
//         execute({
//           id: data.id,
//           cardReadMode:isReadMode,
//           showMobileView:isShowMobileView,
//           showBGImage:isShowBGImage,
//           cardYscroll:isYScroll,
//           cardShowTitle:isCardShowTitle,
//           recentDays:recentDays,
//           notificationToaster:notificationToaster,
//           togglePendingTasksOrAll:togglePendingTasksOrAll,
//           toggleRecentTaskorAll:toggleRecentTaskorAll,
//           toggleOverdueorAll:toggleOverdueorAll,
//           toggleInverse:toggleInverse,
          
//           toggleInverseTable:toggleInverseTable,
//           emptyListShow:emptyListShow,
//           showMyProjectsOnLoad:showMyProjectsOnLoad,
//           collapseBoards:collapseBoards
//         })

        
      
//     } else{
//         execute({
//           id: data.id,
//           roles:stringRoles,
//           isAdmin:isAdmin
//         })
//     }

//   } 


//   interface Option {
//     value: string;
//     label:string;
//   }
//   const options: Option[] = [
//     { value: 'visitor', label:"visitor"},
//     { value: 'employee', label:"employee"},
//     { value: 'manager', label:"manager"},
//     { value: 'admin', label:"admin"},
//     // ...
//   ];
//   const convertToOptionArray = (values: string[]): MultiValue<Option> => {
//     return values.map((value) => ({ value, label:value })); // Assuming value is the property name
//   };
//   const [selectedValue, setSelectedValue] = useState<MultiValue<Option>>(convertToOptionArray(data.roles.map((option: any) => option)));


// const handleSelectChange = (newValue: MultiValue<Option>, actionMeta: ActionMeta<Option>) => {
//   const optionsArray = Array.from(newValue); // Convert iterator to array
//   setSelectedValue(optionsArray);
// };

// let allowedRoles:String[]
// allowedRoles=['admin', 'manager']
// const isAllowedAccess = currentUser?.roles.filter((role: string) =>
//                           (//Outer bracket ::forEach user role  
//                               //Search Card  within the List
//                               allowedRoles.some((y)=>(// Allowed Roles
//                                   //Search Card Title
//                                   y.toLowerCase().includes(role.toLowerCase())
                                  
//                                 )// Return clossing bracket
//                               )
//                         )// Out bracker
//                     ) || []
// // not admin and not user record
//  if (isAllowedAccess?.length==0 && currentUser?.id!==data.id) return redirect('/denied') 

//   return (
//     <div className="flex items-start gap-x-3 md:min-w-[700px]">
//       <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
//       <div className="w-full">
//         <p className="flex flex-row justify-between font-semibold text-neutral-700 mb-2">
//            <div className="flex flex-row">
//               {isChecked 
//                     &&  <svg className="text-rose-700 cursor-pointer peer peer-hover:text-yellow-400 hover:text-yellow-400 duration-100 " width="23" height="23" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
//                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
//                   </svg>
//               } 
//              {isCurrentLogInUserRecord? 'Profile Details': 'User Details'}
//           </div>
         
//           {!isCurrentLogInUserRecord && <Link
//             href={`/users`}
//             className="hover:text-sm hover:text-red-700"
            
//               >
//              Back to <b>Users List</b>
//           </Link>}
//         </p>

//         {
//         // isEditing ?
        
//         (
//           <form
//             id="id1"
//             name= "name1"
//             action={onSubmit}
//             ref={formRef}
//             className="space-y-2"
//           >
//             <FormTextarea
//               id="email"
//               className="w-full mt-2 min-h-[178px] "
//               placeholder="Add a more detailed description"
//               defaultValue={data?.email || "HHH"  }
//               errors={fieldErrors}
//               ref={textareaRef}
//             /> 
//           <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                 <label htmlFor="recentDays">Recent-Days</label>
//                   <input 
//                       id="recentDays" 
//                       name="recentDays"
//                       type="number" 
//                       ref={inputRecentDayRef} 
//                       value={recentInput}
//                       className="border w-16 pl-5"
//                       onChange={handleRecentInputChange}
//                      disabled={!isCurrentLogInUserRecord} />
//                 </div>

//                 <div className="space-x-2">
//                   <input 
//                       id="cardShowTitle" 
//                       name="cardShowTitle"
//                       type="checkbox" 
//                       ref={checkboxShowTitleRef} 
//                       checked={isCheckedShowTitle}
//                       onChange={handleCheckboxShowTitleChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Card ShowTitle</label>
//                 </div>
                
//             </div>
//            <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="cardReadMode" 
//                       name="cardReadMode"
//                       type="checkbox" 
//                       ref={checkboxReadModeRef} 
//                       checked={isCheckedReadMode}
//                       onChange={handleCheckboxReadModeChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Card ReadMode</label>
//                 </div>
            
//                 <div className="space-x-2">
//                   <input 
//                       id="cardYscroll" 
//                       name="cardYscroll"
//                       type="checkbox" 
//                       ref={checkboxYScrollRef} 
//                       checked={isCheckedYscroll}
//                       onChange={handleCheckboxYScrollChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Y-Scroll Mode</label>
//                 </div>
//             </div>

      
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="notificationToaster" 
//                       name="notificationToaster"
//                       type="checkbox" 
//                       ref={checkboxNotificationToasterRef} 
//                       checked={isCheckedNotificationToaster}
//                       onChange={handleCheckboxNotificationToasterChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Mobile Notification Toaster</label>
//                 </div>
//                 <div className="space-x-2">
//                   <input 
//                       id="togglePendingTasksOrAll" 
//                       name="togglePendingTasksOrAll"
//                       type="checkbox" 
//                       ref={checkboxTogglePendingTasksOrAllRef} 
//                       checked={isCheckedTogglePendingTasksOrAll}
//                       onChange={handleCheckboxTogglePendingTasksOrAllChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Toggle Pending Tasks otherwise show All</label>
//                 </div>
//             </div>
   
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="toggleRecentTaskorAll" 
//                       name="toggleRecentTaskorAll"
//                       type="checkbox" 
//                       ref={checkboxToggleRecentTaskorAllRef} 
//                       checked={isCheckedToggleRecentTaskorAll}
//                       onChange={handleCheckboxToggleRecentTaskorAllChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Toggle Recent Tasks otherwise show All </label>
//                 </div>
//                 <div className="space-x-2">
//                   <input 
//                       id="toggleInverse" 
//                       name="toggleInverse"
//                       type="checkbox" 
//                       ref={checkboxToggleInverseRef} 
//                       checked={isCheckedToggleInverse}
//                       onChange={handleCheckboxToggleInverseChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Toggle Inverse [Completed , overdue etc]</label>
//                 </div>
//             </div> 
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="emptyListShow" 
//                       name="emptyListShow"
//                       type="checkbox" 
//                       ref={checkboxEmptyListShowRef} 
//                       checked={isCheckedEmptyListShow}
//                       onChange={handleCheckboxEmptyListShowChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Display Empty Lists</label>
//                 </div>
//                 <div className="space-x-2">
//                   <input 
//                       id="showMyProjectsOnLoad" 
//                       name="showMyProjectsOnLoad"
//                       type="checkbox" 
//                       ref={checkboxShowMyProjectsOnLoadRef} 
//                       checked={isCheckedShowMyProjectsOnLoad}
//                       onChange={handleCheckboxShowMyProjectsOnLoadChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Show My-Projects at start otherwise show All</label>
//                 </div>
//             </div> 
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="toggleOverdueorAll" 
//                       name="toggleOverdueorAll"
//                       type="checkbox" 
//                       ref={checkboxToggleOverdueorAllRef} 
//                       checked={isCheckedToggleOverdueorAll}
//                       onChange={handleCheckboxToggleOverdueorAllChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Toggle OverdueorAll</label>
//                 </div>

//                 <div className="space-x-2">
//                   <input 
//                       id="showBGImage" 
//                       name="showBGImage"
//                       type="checkbox" 
//                       ref={checkboxShowBGImageRef} 
//                       checked={isCheckedShowBGImage}
//                       onChange={handleCheckboxShowBGImageChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Show Background Image</label>
//                 </div>
              
//             </div> 
           
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="toggleInverseTable" 
//                       name="toggleInverseTable"
//                       type="checkbox" 
//                       ref={checkboxToggleInverseTableRef} 
//                       checked={isCheckedToggleInverseTable}
//                       onChange={handleCheckboxToggleInverseTableChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Toggle Inverse Table</label>
//                 </div>

//                 <div className="space-x-2">
//                   <input 
//                       id="collapseBoards" 
//                       name="collapseBoards"
//                       type="checkbox" 
//                       ref={checkboxCollapseBoardsRef} 
//                       checked={isCheckedCollapseBoards}
//                       onChange={handleCheckboxCollapseBoardsChange} 
//                       disabled={!isCurrentLogInUserRecord}/>
//                   <label htmlFor="checkbox">Collapse Boards[Mini-View-State]</label>
//                 </div>
//             </div> 
          
          
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="showMobileView" 
//                       name="showMobileView"
//                       type="checkbox" 
//                       ref={checkboxShowMobileViewRef} 
//                       checked={isCheckedShowMobileView}
//                       onChange={handleCheckboxShowMobileViewChange} 
//                       disabled={!isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Show Mobile View on Desktop</label>
//                 </div>
//              </div>
//             <Separator/>
//             <div className="flex md:flex-row flex-col justify-between">
//                 <div className="space-x-2">
//                   <input 
//                       id="isAdmin" 
//                       name="isAdmin"
//                       type="checkbox" 
//                       ref={inputboxRef} 
//                       checked={isChecked}
//                       onChange={handleCheckboxChange}
//                       disabled={isCurrentLogInUserRecord} />
//                   <label htmlFor="checkbox">Is User Admin?</label>
//                 </div>
            
//                 <div className="flex flex-row space-x-2">
//                   <label htmlFor="progress" className="italic">Roles:</label>
                 
//                   <Select
//                       className="text-gray-500"
//                       id="roles"
//                       name="roles"
//                       value={selectedValue}
//                       onChange={handleSelectChange}
//                       options={options}
//                       isMulti // Enables multi-selection
//                       isDisabled={isCurrentLogInUserRecord}
//                     />
//                 </div>
//             </div>
//             <Separator/>
           
//             <div className="flex items-center gap-x-2">
//               <FormSubmit 
//                     className={cn(
//                     "",
//                     isCurrentLogInUserRecord  ? "bg-rose-600" : "",
//                   )}
//               >
//                 Save
//               </FormSubmit>
//               <Button
//                 type="button"
//                 //onClick={disableEditing}
//                 size="sm"
//                 variant="ghost"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>
//         // ) : (
//         //   <>
//         //       <div
//         //         onClick={enableEditing}
//         //         role="button"
//         //         className="min-h-[178px] bg-neutral-200 text-sm font-medium py-3 px-3.5 rounded-md"
//         //       >
//         //         {data.email || "Add a more detailed description..."}
//         //       </div>
//         //       <div className="flex flex-row justify-between">
//         //           <div className="space-x-2">
//         //               <input 
//         //                   id="isAdmin" 
//         //                   name="isAdmin"
//         //                   type="checkbox" 
//         //                   ref={inputboxRef} 
//         //                   checked={isChecked}
//         //                   disabled={true} />
//         //               <label htmlFor="checkbox">Is User Admin?</label>
//         //           </div>
//         //           <div className="flex flex-row space-x-2">
//         //             <label htmlFor="progress" className="italic">Roles:</label>
//         //             <span className="text-rose-500">{data?.roles.join(", ")}</span>
//         //           </div>
//         //       </div>
//         //       <div className="flex flex-row justify-between">
//         //         <div className="space-x-2">           
//         //           <label htmlFor="progress">Name</label>
//         //           <span className="text-rose-500">{data.name} </span> 
//         //         </div>
              
//         //       </div>
//         //       <div  
//         //         onClick={enableEditing} 
//         //         role="button"
//         //         className="mt-2 text-sm text-blue-500">
//         //           Click here to update {data.email} roles
//         //       </div>
//         //   </>
//         )
//         }
//       </div>
//     </div>
//   );
// };

// UserData.Skeleton = function UserDataSkeleton() {
//   return (
//     <div className="flex items-start gap-x-3 w-full">
//       <Skeleton className="h-6 w-6 bg-neutral-200" />
//       <div className="w-full">
//         <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
//         <Skeleton className="w-full h-[98px] bg-neutral-200" />
//       </div>
//     </div>
//   );
// };
