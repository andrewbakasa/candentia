import { cn } from "@/lib/utils";
import moment from "moment";

interface DatesProps {
  createdAt: string,
  updatedAt: string
}

const CreatedAtUpdatedAt: React.FC<DatesProps> = ({
        createdAt,
        updatedAt
      }) => {
 const notSameDate = moment(createdAt).fromNow()!== moment(updatedAt).fromNow()
    
  return (
    // <div>
    <div className={cn("flex text-[9px] gap-1",'justify-end')}>
        <span className='flex gap-2 text-[10px] text-red-300 '>{'cre '} {moment(createdAt).fromNow()}</span> 
        {notSameDate && <span className='flex gap-2 text-[10px] text-blue-500 '>{'upd '} {moment(updatedAt).fromNow()}</span> }
        
    </div>
    // </div>
  );
};

export default CreatedAtUpdatedAt;



/* 
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface DatesProps {
  createdAt: string;
  updatedAt: string;
}

const CreatedAtUpdatedAt: React.FC<DatesProps> = ({ createdAt, updatedAt }) => {
  const createdAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const updatedAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
  const notSameDate = createdAgo !== updatedAgo;

  return (
    <div className={cn("flex text-[9px] gap-1", "justify-end")}>
      <span className="flex gap-2 text-[10px] text-red-300">
        {'cre '}
        {createdAgo}
      </span>
      {notSameDate && (
        <span className="flex gap-2 text-[10px] text-blue-500">
          {'upd '}
          {updatedAgo}
        </span>
      )}
    </div>
  );
};

export default CreatedAtUpdatedAt;

*/


