import Loading from "@/components/custom/Loading";
import Pagination from "@/components/custom/Pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET_ALL_BOOKINGS } from "@/graphql/queries/booking.queries";
import {
  calculateTablePaginationEnd,
  calculateTablePaginationStart,
  formatDate,
  toastNotification,
} from "@/helpers/helpers";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@apollo/client";
import { Search, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IBooking } from "shared/src/interfaces";
import { BookingDialogue } from "./partials/BookingDialogue";
import { DELETE_BOOKING_MUTATION } from "@/graphql/mutations/booking.mutation";

const ListBookings = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { error, data, loading, refetch } = useQuery(GET_ALL_BOOKINGS, {
    variables: {
      page,
      query,
    },
  });

  const bookings = data?.getAllBookings?.bookings;

  const pagination = data?.getAllBookings?.pagination;

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  //DELETE car
  const [deleteBooking, { loading: deleteBookingLoading, error: deleteError }] =
    useMutation(DELETE_BOOKING_MUTATION, {
      onCompleted: () => {
        refetch();
        toast({
          title: "Successfully",
          variant: "success",
        });
      },
    });

  useEffect(() => {
    if (error) {
      toast({
        title: "Something went wrong",
        description: `${error}`,
      });
    }
    if (deleteError) {
      toast({
        title: "Something went wrong",
        description: `${deleteError}`,
      });
    }
  }, [error, deleteError]);

  const deleteBookingHandler = async (id: string) => {
    try {
      await deleteBooking({
        variables: { bookingId: id },
      });
    } catch (error) {
      toastNotification(error);
    }
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updatedSearchParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      updatedSearchParams.set("query", searchQuery);
    } else {
      updatedSearchParams.delete("query");
    }

    navigate(`/admin/bookings?${updatedSearchParams.toString()}`);
  };

  if (loading) {
    return <Loading size={60} fullScreen={true} />;
  }

  return (
    <div className="relative">
      <Card>
        <CardHeader className="flex flex-col md:flex-row mb-4">
          <div className="flex-1">
            <CardTitle>Bookings</CardTitle>
            <CardDescription>View your booking details</CardDescription>
          </div>
          <form onSubmit={submitHandler}>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Enter booking ID"
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  ID
                </TableHead>
                <TableHead>Car Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="hidden md:table-cell">
                  CreatedAt
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking: IBooking) => (
                <TableRow key={booking?.id}>
                  <TableCell className="hidden sm:table-cell">
                    {booking?.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {booking?.car?.name}
                  </TableCell>
                  <TableCell>{booking?.paymentInfo?.status}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {booking?.amount?.total}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(booking?.createdAt)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <BookingDialogue
                      refetchBookings={refetch}
                      updateBookingData={booking}
                    />
                    <span onClick={() => deleteBookingHandler(booking?.id)}>
                      <Button
                        variant={"destructive"}
                        className="ms-2"
                        size={"icon"}
                        loading={deleteBookingLoading}
                        disabled={deleteBookingLoading}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {pagination?.totalCount > 0 && (
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              {calculateTablePaginationStart(page, pagination?.resPerPage)}-{" "}
              {calculateTablePaginationEnd(
                page,
                pagination?.resPerPage,
                pagination?.totalCount
              )}{" "}
              of <strong>{pagination?.totalCount}</strong> bookings
            </div>
          </CardFooter>
        )}
      </Card>
      <Pagination
        resPerPage={pagination?.resPerPage}
        totalCount={pagination?.totalCount}
      />
    </div>
  );
};

export default ListBookings;
