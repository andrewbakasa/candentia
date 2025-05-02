def extract_loco_data_merged(file_path):
    data = []
    allowed_locos = {"DE11", "DE10", "DE9", "DE6","DE6 shunt" "DE34", "DE37","D34", "D37", "STEAM", "Grindrod"}
    summary_exception_count = 0  # Initialize exception counter
    summary_exception_lines = []  # Store lines with exceptions
    variationsDisposition = [
        "Summary of  loco Dispo",
        "Summary of  loco Disposition",
        "Summary of loco  Disposition:",
        "Summary of loco Dispo",
        "Summary of loco Dispositio n:",
        "Summary of loco Disposition:",
        "Summary of loco disposition:",
        "Summary of  loco Disposition"
    ]


    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    current_date = None
    current_time = None
    available_locos = {}
    unavailable_locos = {}  # Combined out-of-service/down
    current_section = None

    for line in lines:
        line = line.strip()
        match = re.match(r"(\d{2}/\d{2}/\d{4}), (\d{2}:\d{2}) - (.*)", line)
        if match:
            # Save the previous data if there was any           
            
            if available_locos:
                locos = set(available_locos.keys()) | set(unavailable_locos.keys())
                for loco in locos:
                    if loco in allowed_locos:
                        available = available_locos.get(loco, 0)
                        unavailable = unavailable_locos.get(loco, 0)
                            # Truncate 'available' to its first two digits
                        available = truncate_to_two_digits(available)

                        data.append({
                            'Date': current_date,
                            'Time': current_time,
                            'Loco': loco,
                            'Available': available,
                            'Unavailable': unavailable,
                        })
                #reset per each user entry
                available_locos = {}
                unavailable_locos = {}

            current_date = match.group(1)
            current_time = match.group(2)
            continue

        
        #if current_date=='16/09/2022':
        #    print(f" Highest value: ----------->{current_date} {line}")
            
        #start_date = datetime(2021, 1, 31).date()
        #end_date = datetime(2021, 12, 1).date()   
        #if is_date_in_range(current_date):
            #print(f" test: ----------->{current_date} {line}")    
            
            
        if line.upper() in ["AVAILABLE LOCOS", "AVAILABLELOCOS","AVAILABLE LOCOS"]:
            current_section = "AVAILABLE"
            continue
        elif line.upper() == "OUT OF SERVICE":
            current_section = "UNAVAILABLE"
            continue
        
        elif line in variationsDisposition :
            #print(f":*******************************date : {current_date}  ,{line}")
            current_section = "SUMMARY"
            continue
            
        
        elif search_substrings_any_order(line, ["summary", "of", "loco", "disposition"]):
            current_section = "SUMMARY"
            continue
            
        elif re.search(r"Summary\s+of\s+loco\s+Disposition", line, re.IGNORECASE): # Improved search
            current_section = "SUMMARY"
            print('this case 1',line)
            summary_exception_count += 1  # Increment exception counter
            summary_exception_lines.append(line)  # Store the line
            continue

        elif re.search(r"Summary\s+of\s+loco\s+Dispositi", line, re.IGNORECASE): # Improved search
            current_section = "SUMMARY"
            print('------>2',line)
            summary_exception_count += 1  # Increment exception counter
            summary_exception_lines.append(line)  # Store the line
            continue

        elif re.search(r"Summary\s+of\s + loco\s+Dispositi", line, re.IGNORECASE): # Improved search
            #Summary of  loco Disposition
            current_section = "SUMMARY"
            print('$$$$$$$$$$$$$$$$$$ 3:  ',line)
            summary_exception_count += 1  # Increment exception counter
            summary_exception_lines.append(line)  # Store the line
            continue

        

                
        elif "SHUNTS" in line:
            current_section = "SHUNTS"
            continue

            
        #-----Loop to find locomotives    
        if current_section == "AVAILABLE":
            parts = line.split()
            
            if len(parts) >= 2:#why two an above
                key = parts[0].rstrip(",.:-")
                if key in allowed_locos:
                    try:
                        substrings_to_check = [key, "shunt"]
                        result = check_substrings(line, substrings_to_check)
                        if result:
                            if key in available_locos:
                                available_locos[key] += int(parts[-1])
                            else:
                                available_locos[key] = int(parts[-1])
                        else:
                            if key in available_locos:
                                available_locos[key] += int(parts[-1])
                            else:
                                value = int(parts[-1])
                                available_locos[key] = value
                        
                    except ValueError:
                        pass
                else:
                    pass
                    #print(f'Available passed:{parts}')
        elif current_section == "UNAVAILABLE":
            parts = line.split()
            if len(parts) >= 2:#why two an above
                key = parts[0].rstrip(",.:-")
                if key in allowed_locos:
                    try:
                        substrings_to_check = [key, "shunt"]
                        result = check_substrings(line, substrings_to_check)
                        if result:
                            if key in available_locos:
                                unavailable_locos[key] += int(parts[-1])
                            else:
                                unavailable_locos[key] = int(parts[-1])
                        else:
                            if key in available_locos:
                                unavailable_locos[key] += int(parts[2])
                            else:
                                value = int(parts[-1])
                                unavailable_locos[key] = value
                    except ValueError:
                        pass
                else:
                    pass
                    #print(f'Unavailable passed:{parts}')
        elif current_section == "SUMMARY":
            parts = line.split()
            if len(parts) >= 2:#why two an above
                key = parts[0].rstrip(",.:-")
                if len(parts) >= 3 and key in allowed_locos:
                    try:
                        substrings_to_check = [key, "shunt"]
                        result = check_substrings(line, substrings_to_check)
                        if result:
                            #print(f"3. shunt found {key}, shunt data: {parts[2]}")
                            if key in available_locos:
                                available_locos[key] += int(parts[2])
                            else:
                                available_locos[key] = int(parts[2])
                            #unavailable_locos[key] = int(parts[2]) #Used to be down_locos
                        else:
                            if key in available_locos:
                                available_locos[key] += int(parts[1])
                            else:
                                available_locos[key] = int(parts[1])
                                unavailable_locos[key] = int(parts[2]) #Used to be down_locos
                    except ValueError:
                        pass
                elif len(parts) >= 2 and key in allowed_locos:
                    try:
                        if key in available_locos:
                            available_locos[key] += int(parts[1])
                        else:
                            available_locos[key] = int(parts[1])
                    except ValueError:
                        pass
                else:
                    pass
                    
        elif current_section == "SHUNTS":
            parts = line.split()
            #print(f" shunts: {parts}")
            if len(parts) >= 2:#why two an above
                key = parts[0].rstrip(",.:-")
                if len(parts) >= 3 and key in allowed_locos:
                    try:
                        substrings_to_check = [key, "shunt"]
                        result = check_substrings(line, substrings_to_check)
                        if result:
                            if key in available_locos:
                                available_locos[key] += int(parts[-1])
                            else:
                                available_locos[key] = int(parts[-1])
                        else:
                            if key in available_locos:
                                available_locos[key] += int(parts[1])
                            else:
                                available_locos[key] = int(parts[1])
                                unavailable_locos[key] = int(parts[2])#Used to be down_locos
                    except ValueError:
                        pass
                elif len(parts) >= 2 and key in allowed_locos:
                    #len 3 is for shunts ['DE6', 'shunt', '2']
                    #loco: DE10   len: 2 answ: ['DE10', 'Commuter'
                    #print(f"Shunts ********************************{parts}")
                    try:
                        if key in available_locos:
                            available_locos[key] += int(parts[1])
                        else:
                            available_locos[key] = int(parts[1])
                    except ValueError:
                        pass

    # Save the last data section (if any)
    if available_locos:
        locos = set(available_locos.keys()) | set(unavailable_locos.keys())
        for loco in locos:
            if loco in allowed_locos:
                available = available_locos.get(loco, 0)
                unavailable = unavailable_locos.get(loco, 0)

                data.append({
                    'Date': current_date,
                    'Time': current_time,
                    'Loco': loco,
                    'Available': available,
                    'Unavailable': unavailable,
                })

    df = pd.DataFrame(data)
    print(f"Summary section exceptions found: {summary_exception_count}") #print exception count
    
    return df,summary_exception_lines

   