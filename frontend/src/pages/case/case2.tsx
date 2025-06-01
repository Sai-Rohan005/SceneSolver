import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator
  } from "@/components/ui/dropdown-menu";

import {
  ArrowLeft,
  BarChart3,
  Book,
  Camera,
  Eye,
  FileText,
  FileUp,
  Fingerprint,
  Image,
  Info,
  LayoutGrid,
  MessageSquare,
  Microscope,
  Plus,
  Scroll,
  Settings,
  Share,
  Trash2,
  UploadCloud,
  Send

} from "lucide-react";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";




export default function Case2() {
    const { caseId } = useParams();
    const [caseName, setCaseName] = useState(`Case #${caseId?.replace("case-", "")}`);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"sources" | "chat" | "studio">("sources");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [officer,setofficer]=useState("Chat Interface");
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [BgColor,setBgColor]=useState("bg-white");
    const token = sessionStorage.getItem('authToken');
    const [email,setEmail]=useState("")
    const [customMessage,setCustomMessage]=useState("");
    const formdata={
        images:null
    }

    const navigate=useNavigate();
    
    const decoded = jwtDecode<{}>(token);
    if(decoded['role']!="common"){
        navigate("*")
    }
    

    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };



    const [messages, setMessages] = useState([
      { from: "other", text: "Hello! How can I help you today?" },
    ]);
    
    const [chatMessages, setChatMessages] = useState<{
    timestamp: ReactNode;
    id: number; text: string, isBot: boolean 
    }[]>([]);
    const [messageInput, setMessageInput] = useState('');


    useEffect(()=>{
        const get_usermail=async()=>{
          const res=await axios.get(`http://localhost:7070/api/cases/getOfficermail/${caseId}`)
          const username = res.data.email.split('@')[0];
          const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
          setofficer(formattedName);
        }
        get_usermail();
      },[])
    


    const sendInvitation = async () => {

        if (!email) {
          toast({
            title: "Missing Email",
            description: "Please enter an email address.",
            variant: "destructive",
          });
          return;
        }
        // console.log("Sending invitation email to:", email);
    
        try {
          const res = await fetch("http://localhost:7070/api/invitation/send-invitation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Authorization: `Bearer ${sessionStorage.getItem("authToken")}` // Uncomment if needed
            },
            body: JSON.stringify({
              email
            }),
          });
    
          const data = await res.json();
    
          if (res.ok) {
            toast({
              title: "Invitation Sent",
              description: `Invitation sent to ${email}`,
            });
            setEmail("");
            setCustomMessage("");
          } else {
            toast({
              title: "Failed to Send",
              description: data.message || "Something went wrong.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "An unexpected error occurred while sending the invitation.",
            variant: "destructive",
          });
        }
      };

    
    useEffect(() => {
      const fetchImages = async () => {
        try {
          const getmsg=await axios.get(`http://localhost:7070/api/messages/conversations/${caseId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                  }
            }
          );
          // console.log(getmsg);
          const updatedMessages = getmsg.data.messages.map(msg => ({
            ...msg,
            isBot: msg.senderId === decoded['email']
          }));
          // console.log(updatedMessages);
          
          setChatMessages(updatedMessages);

        }catch(err){
          console.log(err);
        }


      };
    
      if (caseId) {
        fetchImages(); // Trigger fetch if caseId exists
      }
    
    }, [caseId, toast,uploadedImages]); // Effect triggers when caseId changes
    
   
    
    useEffect(()=>{
        const fetchImages = async () =>{
            try{
                const getImages=await axios.get(`http://localhost:7070/api/cases/images/${caseId}`)
                console.log(getImages)
                const allFilePaths = getImages.data.map(image => image.file_path);
                setUploadedImages(allFilePaths);
            }catch(err){
                console.log(err);
            }
        }
        fetchImages();
    },[])
    

  // Handle incoming calls


    
  



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
    
      const formData = new FormData();
    
      let imageCount = 0;
      let videoCount = 0;
    
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          formData.append("image", file); // same key used for multiple images
          imageCount++;
        } else if (file.type.startsWith("video/")) {
          formData.append("videos", file); // same key used for multiple videos
          videoCount++;
        } else {
          toast({
            title: "Invalid File Type",
            description: `Unsupported file type: ${file.name}`,
            variant: "destructive",
          });
        }
      });
    
      try {
        const response = await axios.post(`http://localhost:7070/api/cases/upload/${caseId}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
              },
        });
    
        if (response.status !== 200) {
          toast({
            variant: "destructive",
            title: "File Upload Error",
            description: response.data.message,
          });
        } else {
          toast({
            title: "Upload Successful",
            description: `Uploaded ${imageCount} image${imageCount !== 1 ? "s" : ""} and ${videoCount} video${videoCount !== 1 ? "s" : ""}.`,
          });
    
          setUploadedImages((prev) => [
            ...prev,
            ...Array.from(files)
              .filter((f) => f.type.startsWith("image/"))
              .map((file) => URL.createObjectURL(file)),
          ]);
        }
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload files. Please try again.",
          variant: "destructive",
        });
      }
    
      // Clear input
      if (e.target) {
        e.target.value = "";
      }
    };
    

    

  
   
    const sendMessage = async () => {
      if (!messageInput.trim()) return;
    
      const currentMessage = messageInput;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessageInput('');
    
      // Optimistically show the message
      const tempId = Date.now(); // unique id for temp tracking
      // setChatMessages((prev) => [
      //   ...prev,
      //   { id: tempId, text: currentMessage, isBot: false, sending: true, timestamp }
      // ]);
    
      try {
        // Send the message to the server
        const response = await axios.post(`http://localhost:7070/api/messages/message/${caseId}`, {
          text: currentMessage,
          senderId: ""  // Handle senderId logic as per your requirement
        },{
            headers: {
                Authorization: `Bearer ${token}`,
              },
        });
    
        // Mark message as successfully sent (remove "sending" flag)
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, sending: false, failed: false, timestamp } : msg
          )
        );
    
        // Optionally add the server's response (if it includes the full message data or metadata) to the chat
        setChatMessages((prev) => [
          ...prev,
          { id: response.data.messageId, text: currentMessage, isBot: false, sending: false, timestamp }
        ]);
      } catch (error) {
        console.error('Failed to send message:', error);
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, sending: false, failed: true, timestamp } : msg
          )
        );
      }
    };
    
    


    


  

  

  
  
    return (
      <>

        <div className={`flex flex-col min-h-screen transition-colors duration-300 ${BgColor}`}>

        <header className="flex flex-wrap items-center justify-between p-4 border-b gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/common">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold truncate">{caseName}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Share Dialog */}
            <Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">
      <Share className="w-4 h-4 mr-2" />
      Share
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share this case</DialogTitle>
      <DialogDescription>
        Invite others to collaborate on this forensic investigation.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Input
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Optional message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
        />
        <Button size="sm" className="w-full" onClick={sendInvitation}>
          Send invitation
        </Button>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium mb-2">Share link</p>
        <div className="flex items-center gap-2">
          <Input value={window.location.href} readOnly />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

            {/* Settings Dropdown */}
            <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuLabel>Background</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setBgColor("bg-white")}>
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setBgColor("bg-gray-900 text-white")}>
                                        Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setBgColor("bg-blue-50")}>
                                        Soft Blue
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setBgColor("bg-yellow-50")}>
                                        Cream
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
          </div>
        </header>


        {/* Main Content */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">

          <div className={`w-full md:w-96 border-r overflow-y-auto ${activeTab === "sources" ? "block" : "hidden md:block"}`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Evidence</h2>
              <Button variant="ghost" size="icon">
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3">
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>

            {uploadedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
                  <div className="p-6 bg-muted/50 rounded-lg mb-6">
                    {/* Placeholder for file upload icon */}
                  </div>
                  <h3 className="font-medium text-lg">Upload evidence</h3>
                  <p className="text-sm mt-2 max-w-xs mb-8">
                    Upload images and videos from the crime scene or other evidence to analyze patterns and generate insights.
                  </p>
                  <Button variant="default" className="gap-1" onClick={triggerFileUpload}>
                    {/* Upload icon */}
                    Upload evidence
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {uploadedImages.map((src, index) => {
                                        const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
                                        return (
                                        <div
                                            key={index}
                                            className={`relative group rounded-md border overflow-hidden flex items-center p-2 hover:bg-accent cursor-pointer `
                                          
                                          }
                                        >
                                            <div className="h-16 w-16 rounded overflow-hidden mr-3 flex-shrink-0">
                                            {isVideo ? (
                                                <video
                                                src={src}
                                                className="h-full w-full object-cover"
                                                muted
                                                loop
                                                playsInline
                                                />
                                            ) : (
                                                <img
                                                src={src}
                                                alt={`Evidence ${index + 1}`}
                                                className="h-full w-full object-cover"
                                                />
                                            )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">Evidence {index + 1}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {isVideo ? 'Video' : 'Image'} • Added {new Date().toLocaleDateString()}
                                            </p>
                                            </div>
                                            <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            >
                                            <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        );
                                    })}
                
              </div>
            )}

            <div className="mt-auto p-4 border-t">
              <div className="flex items-center bg-muted/50 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Evidence summary</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button size="sm" className="rounded-full w-8 h-8 p-0 flex-shrink-0" onClick={triggerFileUpload}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b bg-slate-500 text-white">
            <h2 className="font-semibold text-lg">{officer}</h2>
          </div>

          {/* Incoming Video Call Notification */}


          {/* Chat Messages */}
          <div className="flex-1 flex flex-col p-4 bg-gray-100 overflow-auto min-h-0">
            <div className="space-y-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${msg.isBot ? "bg-muted" : "bg-primary text-white"}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="flex items-center space-x-2 p-4 border-t bg-white">
            <input
              type="text"
              className="flex-1 p-2 border rounded-md"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={sendMessage}
              disabled={messageInput.trim() === ""}
            >
              Send
            </button>
          </div>
        </div>

        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden border-t">
          <div className="grid grid-cols-3 divide-x">
            <button
              className={`flex flex-col items-center py-3 ${activeTab === "sources" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("sources")}
            >
              <Image className="h-5 w-5 mb-1" />
              <span className="text-xs">Images</span>
            </button>
            <button
              className={`flex flex-col items-center py-3 ${activeTab === "chat" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("chat")}
            >
              <Eye className="h-5 w-5 mb-1" />
              <span className="text-xs">Preview</span>
            </button>
            <button
              className={`flex flex-col items-center py-3 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("studio")}
            >
              <Microscope className="h-5 w-5 mb-1" />
              <span className="text-xs">Tools</span>
            </button>
          </div>
        </div>

        </div>
      
      
      
      </>
        

    );
}

function Customize({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2H2v10h10V2z" />
            <path d="M22 12h-10v10h10V12z" />
            <path d="M12 12H2v10h10V12z" />
            <path d="M22 2h-10v10h10V2z" />
        </svg>
    );
}

function animateTyping(summary) {
  throw new Error("Function not implemented.");
}